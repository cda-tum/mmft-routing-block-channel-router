use std::f64::consts::PI;

use serde::{Deserialize, Serialize};

use crate::board_router::BoardRouterOutputBoard;
use crate::dxf::{ChannelCap, Polyline, octilinear_outline};

const CIRCLE_SEGS: usize = 32;

// Mounting tab geometry for the 105×15 mm STARTER template board.
// Each tab has a rectangular section (TAB_RECT_H tall) topped by a semicircle (TAB_R radius).
const TEMPLATE_TAB_RECT_H: f64 = 2.125;
const TEMPLATE_TAB_R: f64 = 2.0;
const TEMPLATE_SCREW_HOLE_RADIUS: f64 = 1.0;

// Screw hole centers = arc centers of each tab, in Y-up board-relative mm.
const TEMPLATE_SCREW_HOLE_CENTERS: [[f64; 2]; 10] = [
    [-3.0,  2.0  ],  // left tab
    [ 6.0,  17.125],  // top tab
    [24.0,  17.125],
    [42.0,  17.125],
    [60.0,  17.125],
    [78.0,  17.125],
    [96.0,  17.125],
    [33.0,  -2.125],  // bottom tab
    [69.0,  -2.125],
    [105.0, -2.125],  // bottom-right corner tab
];

#[derive(Serialize, Deserialize)]
pub struct GenerateSTLInput {
    pub connections: BoardRouterOutputBoard,
    pub channel_width: f64,
    pub channel_cap: ChannelCap,
    pub channel_height: f64,
    pub board_width: f64,
    pub board_height: f64,
    pub board_thickness: f64,
    pub port_diameter: f64,
    #[serde(default)]
    pub is_template: bool,
}

#[derive(Serialize, Deserialize)]
pub struct GenerateSTLOutput(pub Vec<u8>);

struct Triangle {
    normal: [f32; 3],
    vertices: [[f32; 3]; 3],
}

impl Triangle {
    fn new(v0: [f64; 3], v1: [f64; 3], v2: [f64; 3]) -> Self {
        let e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        let e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
        let nx = e1[1] * e2[2] - e1[2] * e2[1];
        let ny = e1[2] * e2[0] - e1[0] * e2[2];
        let nz = e1[0] * e2[1] - e1[1] * e2[0];
        let len = (nx * nx + ny * ny + nz * nz).sqrt();
        let normal = if len > 1e-10 {
            [(nx / len) as f32, (ny / len) as f32, (nz / len) as f32]
        } else {
            [0.0, 0.0, 0.0]
        };
        Triangle {
            normal,
            vertices: [
                [v0[0] as f32, v0[1] as f32, v0[2] as f32],
                [v1[0] as f32, v1[1] as f32, v1[2] as f32],
                [v2[0] as f32, v2[1] as f32, v2[2] as f32],
            ],
        }
    }
}

fn write_binary_stl(triangles: &[Triangle]) -> Vec<u8> {
    let mut out = Vec::with_capacity(84 + triangles.len() * 50);
    out.extend_from_slice(&[0u8; 80]);
    out.extend_from_slice(&(triangles.len() as u32).to_le_bytes());
    for t in triangles {
        for &n in &t.normal {
            out.extend_from_slice(&n.to_le_bytes());
        }
        for v in &t.vertices {
            for &c in v {
                out.extend_from_slice(&c.to_le_bytes());
            }
        }
        out.extend_from_slice(&[0u8; 2]);
    }
    out
}

fn xy(p: [f64; 2], z: f64) -> [f64; 3] {
    [p[0], p[1], z]
}

// The octilinear outline uses Y-down internally. Apply the same transform as DXF
// (invert Y, shift by board_height) to get a standard right-hand Y-up coordinate system.
fn transform_y(pts: Vec<[f64; 2]>, board_height: f64) -> Vec<[f64; 2]> {
    pts.into_iter().map(|[x, y]| [x, board_height - y]).collect()
}

fn earcut_flat(data: &[f64], hole_indices: &[usize]) -> Vec<usize> {
    earcutr::earcut(data, hole_indices, 2).unwrap_or_default()
}

// Returns a CW circle polygon (for use as an earcutr hole inside a CCW outer contour).
fn circle_cw(cx: f64, cy: f64, r: f64) -> Vec<[f64; 2]> {
    (0..CIRCLE_SEGS)
        .map(|i| {
            let theta = -2.0 * PI * (i as f64) / (CIRCLE_SEGS as f64);
            [cx + r * theta.cos(), cy + r * theta.sin()]
        })
        .collect()
}

// Generates n_total-1 evenly spaced arc points from start_deg (exclusive) to end_deg
// (inclusive). Used to append arc segments to a polygon without duplicating the start point.
// Positive (end - start) = CCW arc; negative or wrap-around = CW arc.
fn arc_pts(cx: f64, cy: f64, r: f64, start_deg: f64, end_deg: f64, n_total: usize) -> Vec<[f64; 2]> {
    let step = (end_deg - start_deg) / (n_total - 1) as f64;
    (1..n_total)
        .map(|i| {
            let theta = (start_deg + i as f64 * step).to_radians();
            [cx + r * theta.cos(), cy + r * theta.sin()]
        })
        .collect()
}

// Builds the CCW outline polygon of the 105×15 mm STARTER template board in Y-up
// board-relative coordinates. The outline includes the mounting tab protrusions.
//
// Tracing order: start at top-left (0,15), then down the left edge + left tab,
// right along the bottom + bottom tabs + corner tab, up the right edge,
// left along the top + six top tabs. Earcutr closes the polygon implicitly.
fn template_board_outline() -> Vec<[f64; 2]> {
    let rh = TEMPLATE_TAB_RECT_H; // 2.125 – rectangular section height
    let r  = TEMPLATE_TAB_R;      // 2.0   – semicircle radius

    let mut pts: Vec<[f64; 2]> = Vec::new();

    // ── Left edge: top → junction above left tab ────────────────────────────
    pts.push([0.0, 15.0]);
    pts.push([0.0, 4.0]);

    // ── Left tab ────────────────────────────────────────────────────────────
    // Rectangular section: go left to the tab rect, then arc CCW 90°→270°
    // (through 180° = leftmost point), then return right to the board edge.
    // Arc center (-3, 2), r=2. At 90°: (-3, 4). At 270°: (-3, 0).
    pts.push([-3.0, 4.0]);
    pts.extend(arc_pts(-3.0, 2.0, r, 90.0, 270.0, 9)); // ends at (-3, 0)
    pts.push([0.0, 0.0]);

    // ── Bottom edge + bottom tabs (going right) ──────────────────────────────
    // Tab at X=33
    pts.push([31.0, 0.0]);
    pts.push([31.0, -rh]);
    pts.extend(arc_pts(33.0, -rh, r, 180.0, 360.0, 9)); // ends at (35, -rh)
    pts.push([35.0, 0.0]);

    // Tab at X=69
    pts.push([67.0, 0.0]);
    pts.push([67.0, -rh]);
    pts.extend(arc_pts(69.0, -rh, r, 180.0, 360.0, 9)); // ends at (71, -rh)
    pts.push([71.0, 0.0]);

    // Bottom-right corner tab: full circle centered at (105, -rh).
    // 270° CCW arc from 180° to 90°+360°=450°, passing through 270° and 0°.
    // Start (103, -rh), through (105, -rh-r) and (107, -rh), ends at (105, -rh+r).
    pts.push([103.0, 0.0]);
    pts.push([103.0, -rh]);
    pts.extend(arc_pts(105.0, -rh, r, 180.0, 450.0, 13)); // ends at (105, -rh+r) = (105, -0.125)

    // ── Right edge: bottom → top ─────────────────────────────────────────────
    pts.push([105.0, 15.0]);

    // ── Top edge + top tabs (going left) ────────────────────────────────────
    // Tab arc centers at (cx, 15+rh), r=2. Arc CCW from 0° to 180° (right → top → left).
    // Going right-to-left so encounter tabs at cx = 96, 78, 60, 42, 24, 6.
    for &cx in &[96.0_f64, 78.0, 60.0, 42.0, 24.0, 6.0] {
        let xr = cx + r;
        let xl = cx - r;
        let arc_y = 15.0 + rh; // Y of arc center = 17.125
        pts.push([xr, 15.0]);
        pts.push([xr, arc_y]);
        pts.extend(arc_pts(cx, arc_y, r, 0.0, 180.0, 9)); // ends at (xl, arc_y)
        pts.push([xl, 15.0]);
    }
    // Polygon closes implicitly: earcutr connects last point (4, 15) back to (0, 15). ✓

    pts
}

// Triangulates a 2D polygon with holes at a fixed Z, using earcutr.
// outer must be CCW (in Y-up). holes must be CW (opposite winding).
// flip=true reverses each triangle's winding, yielding a -Z outward normal instead of +Z.
fn add_flat_face(
    tris: &mut Vec<Triangle>,
    outer: &[[f64; 2]],
    holes: &[Vec<[f64; 2]>],
    z: f64,
    flip: bool,
) {
    let mut data: Vec<f64> = outer.iter().flat_map(|p| [p[0], p[1]]).collect();
    let mut hole_indices: Vec<usize> = Vec::new();
    for hole in holes {
        hole_indices.push(data.len() / 2);
        data.extend(hole.iter().flat_map(|p| [p[0], p[1]]));
    }
    let all_pts: Vec<[f64; 2]> = data.chunks(2).map(|c| [c[0], c[1]]).collect();
    for t in earcut_flat(&data, &hole_indices).chunks(3) {
        tris.push(if flip {
            Triangle::new(xy(all_pts[t[0]], z), xy(all_pts[t[2]], z), xy(all_pts[t[1]], z))
        } else {
            Triangle::new(xy(all_pts[t[0]], z), xy(all_pts[t[1]], z), xy(all_pts[t[2]], z))
        });
    }
}

// Adds the lateral surface of a cylinder. The outward normal points inward toward the
// axis (the cylinder is a void, so the solid faces the inside of the hole).
fn add_cylinder_walls(
    tris: &mut Vec<Triangle>,
    cx: f64,
    cy: f64,
    r: f64,
    z_top: f64,
    z_bot: f64,
) {
    for i in 0..CIRCLE_SEGS {
        let theta0 = 2.0 * PI * (i as f64) / (CIRCLE_SEGS as f64);
        let theta1 = 2.0 * PI * ((i + 1) as f64) / (CIRCLE_SEGS as f64);
        let a = [cx + r * theta0.cos(), cy + r * theta0.sin()];
        let b = [cx + r * theta1.cos(), cy + r * theta1.sin()];
        // Winding [A@top, B@top, B@bot] gives normal pointing toward cylinder axis (inward). ✓
        tris.push(Triangle::new(xy(a, z_top), xy(b, z_top), xy(b, z_bot)));
        tris.push(Triangle::new(xy(a, z_top), xy(b, z_bot), xy(a, z_bot)));
    }
}

pub fn generate_stl(input: GenerateSTLInput) -> GenerateSTLOutput {
    let bw = input.board_width;
    let bh = input.board_height;
    let bt = input.board_thickness;
    let ch = input.channel_height;
    let pr = input.port_diameter / 2.0;

    // Per-connection: combined channel outline + port positions (all in Y-up coords).
    let conn_data: Vec<(Vec<[f64; 2]>, Vec<[f64; 2]>)> = input
        .connections
        .connections
        .iter()
        .map(|(_, connection)| {
            let outline = match octilinear_outline(connection, input.channel_width, &input.channel_cap)
            {
                Polyline::Closed(pts) | Polyline::Open(pts) => transform_y(pts, bh),
            };

            let mut ports: Vec<[f64; 2]> = Vec::new();
            if connection.len() == 1 {
                let ch_pts = &connection[0];
                if let Some(&[x, y]) = ch_pts.first() {
                    ports.push([x, bh - y]);
                }
                if ch_pts.len() > 1 {
                    if let Some(&[x, y]) = ch_pts.last() {
                        ports.push([x, bh - y]);
                    }
                }
            } else {
                // Star/tree: the shared base point + each branch endpoint.
                if let Some(first_ch) = connection.first() {
                    if let Some(&[x, y]) = first_ch.first() {
                        ports.push([x, bh - y]);
                    }
                }
                for branch in connection.iter() {
                    if let Some(&[x, y]) = branch.last() {
                        ports.push([x, bh - y]);
                    }
                }
            }

            (outline, ports)
        })
        .collect();

    // Collect and deduplicate all port positions across connections.
    let mut all_ports: Vec<[f64; 2]> = conn_data
        .iter()
        .flat_map(|(_, ports)| ports.iter().cloned())
        .collect();
    all_ports.sort_by(|a, b| {
        a[0].partial_cmp(&b[0])
            .unwrap()
            .then(a[1].partial_cmp(&b[1]).unwrap())
    });
    all_ports.dedup_by(|a, b| (a[0] - b[0]).abs() < 1e-6 && (a[1] - b[1]).abs() < 1e-6);

    // CW circles for every port (used as holes in the flat faces).
    let all_port_holes: Vec<Vec<[f64; 2]>> = all_ports
        .iter()
        .map(|&[cx, cy]| circle_cw(cx, cy, pr))
        .collect();

    let mut tris: Vec<Triangle> = Vec::new();

    if input.is_template {
        let board_outline = template_board_outline();
        let sr = TEMPLATE_SCREW_HOLE_RADIUS;

        // CW circles for each screw hole (used as holes in the flat faces).
        let screw_holes: Vec<Vec<[f64; 2]>> = TEMPLATE_SCREW_HOLE_CENTERS
            .iter()
            .map(|&[cx, cy]| circle_cw(cx, cy, sr))
            .collect();

        // Board side walls: extrude each polygon edge from Z=0 to Z=-bt.
        // Winding [p0@top, p0@bot, p1@bot] gives outward normal for a CCW outer polygon.
        let n = board_outline.len();
        for i in 0..n {
            let p0 = board_outline[i];
            let p1 = board_outline[(i + 1) % n];
            tris.push(Triangle::new(xy(p0, 0.), xy(p0, -bt), xy(p1, -bt)));
            tris.push(Triangle::new(xy(p0, 0.), xy(p1, -bt), xy(p1, 0.)));
        }

        // Screw hole cylinder walls: full board thickness.
        for &[cx, cy] in &TEMPLATE_SCREW_HOLE_CENTERS {
            add_cylinder_walls(&mut tris, cx, cy, sr, 0., -bt);
        }

        // Top face (Z=0): channel holes + screw holes.
        {
            let mut holes: Vec<Vec<[f64; 2]>> =
                conn_data.iter().map(|(outline, _)| outline.clone()).collect();
            holes.extend(screw_holes.iter().cloned());
            add_flat_face(&mut tris, &board_outline, &holes, 0., false);
        }

        // Bottom face (Z=-bt): port holes + screw holes.
        {
            let mut holes = all_port_holes.clone();
            holes.extend(screw_holes.iter().cloned());
            add_flat_face(&mut tris, &board_outline, &holes, -bt, true);
        }
    } else {
        // Board front (Y=0, outward normal (0,-1,0))
        tris.push(Triangle::new([0., 0., 0.], [0., 0., -bt], [bw, 0., -bt]));
        tris.push(Triangle::new([0., 0., 0.], [bw, 0., -bt], [bw, 0., 0.]));

        // Board back (Y=bh, outward normal (0,+1,0))
        tris.push(Triangle::new([bw, bh, 0.], [bw, bh, -bt], [0., bh, -bt]));
        tris.push(Triangle::new([bw, bh, 0.], [0., bh, -bt], [0., bh, 0.]));

        // Board left (X=0, outward normal (-1,0,0))
        tris.push(Triangle::new([0., bh, 0.], [0., bh, -bt], [0., 0., -bt]));
        tris.push(Triangle::new([0., bh, 0.], [0., 0., -bt], [0., 0., 0.]));

        // Board right (X=bw, outward normal (+1,0,0))
        tris.push(Triangle::new([bw, 0., 0.], [bw, 0., -bt], [bw, bh, -bt]));
        tris.push(Triangle::new([bw, 0., 0.], [bw, bh, -bt], [bw, bh, 0.]));

        // Board top face (Z=0, outward normal (0,0,+1)).
        // Only channel outline holes — port circles overlap with channel outlines near endpoints
        // and cause earcutr to fail, so they are omitted here. The port positions are already
        // exposed from the top through the channel opening that covers each endpoint.
        {
            let outer = [[0., 0.], [bw, 0.], [bw, bh], [0., bh]];
            let holes: Vec<Vec<[f64; 2]>> =
                conn_data.iter().map(|(outline, _)| outline.clone()).collect();
            add_flat_face(&mut tris, &outer, &holes, 0., false);
        }

        // Board bottom face (Z=-bt, outward normal (0,0,-1)).
        // Holes: port circles only (channels don't reach the bottom face).
        {
            let outer = [[0., 0.], [bw, 0.], [bw, bh], [0., bh]];
            add_flat_face(&mut tris, &outer, &all_port_holes, -bt, true);
        }
    }

    // Port cylinder walls: full board thickness (Z=0 to Z=-bt).
    for &[cx, cy] in &all_ports {
        add_cylinder_walls(&mut tris, cx, cy, pr, 0., -bt);
    }

    // Per-connection: channel walls + channel floor.
    for (outline, ports) in &conn_data {
        let n = outline.len();
        if n < 3 {
            continue;
        }

        // Channel walls: each outline edge extruded from Z=0 down to Z=-ch.
        // Winding [p0@top, p0@bot, p1@bot] gives inward normal (into channel cavity). ✓
        for i in 0..n {
            let p0 = outline[i];
            let p1 = outline[(i + 1) % n];
            tris.push(Triangle::new(xy(p0, 0.), xy(p0, -ch), xy(p1, -ch)));
            tris.push(Triangle::new(xy(p0, 0.), xy(p1, -ch), xy(p1, 0.)));
        }

        // Channel floor (Z=-ch, outward normal (0,0,+1) pointing up into cavity).
        // Reverse outline CW→CCW so the cross product gives +Z, then triangulate without
        // holes. Port circle centers lie ON the boundary of the outline (at channel
        // endpoints), so half the circle is outside the polygon — earcutr would fail with
        // them as holes. Instead, filter out every triangle whose centroid or any vertex
        // falls inside a port circle; the remaining triangles form an open floor at each
        // port position, letting the full-thickness port cylinder pass through.
        let floor_outer: Vec<[f64; 2]> = outline.iter().rev().cloned().collect();
        let data: Vec<f64> = floor_outer.iter().flat_map(|p| [p[0], p[1]]).collect();
        let floor_pts: Vec<[f64; 2]> = data.chunks(2).map(|c| [c[0], c[1]]).collect();
        let pr2 = pr * pr;
        for t in earcut_flat(&data, &[]).chunks(3) {
            let v0 = floor_pts[t[0]];
            let v1 = floor_pts[t[1]];
            let v2 = floor_pts[t[2]];
            let cx = (v0[0] + v1[0] + v2[0]) / 3.0;
            let cy = (v0[1] + v1[1] + v2[1]) / 3.0;
            let d2 = |a: [f64; 2], b: [f64; 2]| (a[0]-b[0]).powi(2) + (a[1]-b[1]).powi(2);
            let near_port = ports.iter().any(|&p| {
                d2(v0, p) < pr2 || d2(v1, p) < pr2 || d2(v2, p) < pr2 || d2([cx, cy], p) < pr2
            });
            if !near_port {
                tris.push(Triangle::new(xy(v0, -ch), xy(v1, -ch), xy(v2, -ch)));
            }
        }
    }

    GenerateSTLOutput(write_binary_stl(&tris))
}
