use std::f64::consts::PI;

use serde::{Deserialize, Serialize};

use i_overlay::core::fill_rule::FillRule;
use i_overlay::core::overlay::ShapeType;
use i_overlay::core::overlay_rule::OverlayRule;
use i_overlay::core::solver::Solver;
use i_overlay::float::overlay::{FloatOverlay, OverlayOptions};
use i_overlay::i_float::adapter::FloatPointAdapter;
use i_overlay::i_float::float::rect::FloatRect;
use i_overlay::i_shape::base::data::{Shape, Shapes};

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

// Returns a CCW circle polygon, used as a boolean-operation input contour.
fn circle_ccw(cx: f64, cy: f64, r: f64) -> Vec<[f64; 2]> {
    (0..CIRCLE_SEGS)
        .map(|i| {
            let theta = 2.0 * PI * (i as f64) / (CIRCLE_SEGS as f64);
            [cx + r * theta.cos(), cy + r * theta.sin()]
        })
        .collect()
}

// Diagnose wrong winding direction
// Returns the sign, which tells the orientation of the circle: >0 -> counter-clockwise, <0 -> clockwise, == 0 -> degenerate.‚
// Signed area (with shoelace formula); positive when the ring is wound counter-clockwise in a Y-up frame.
fn signed_area(ring: &[[f64; 2]]) -> f64 {
    let n = ring.len();
    let mut a = 0.0;
    for i in 0..n {
        let p = ring[i];
        let q = ring[(i + 1) % n];
        a += p[0] * q[1] - q[0] * p[1];
    }
    a * 0.5
}

// Fix wrong winding direction
// Normalizes a ring to counter-clockwise winding
fn as_ccw(mut ring: Vec<[f64; 2]>) -> Vec<[f64; 2]> {
    if signed_area(&ring) < 0.0 {
        ring.reverse();
    }
    ring
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
// board-relative coordinates. The outline includes the mounting tab outlines.
//
// Tracing order: start at top-left (0,15), then down the left edge + left tab,
// right along the bottom + bottom tabs + corner tab, up the right edge,
// left along the top + six top tabs. Earcutr closes the polygon implicitly.
fn template_board_outline() -> Vec<[f64; 2]> {
    let rh = TEMPLATE_TAB_RECT_H; // 2.125 – rectangular section height
    let r  = TEMPLATE_TAB_R;      // 2.0   – semicircle radius

    let mut pts: Vec<[f64; 2]> = Vec::new();

    // Left edge: top → junction above left tab
    pts.push([0.0, 15.0]);
    pts.push([0.0, 4.0]);

    // Left tab
    // Rectangular section: go left to the tab rect, then arc CCW 90°→270°
    // (through 180° = leftmost point), then return right to the board edge.
    // Arc center (-3, 2), r=2. At 90°: (-3, 4). At 270°: (-3, 0).
    pts.push([-3.0, 4.0]);
    pts.extend(arc_pts(-3.0, 2.0, r, 90.0, 270.0, 9)); // ends at (-3, 0)
    pts.push([0.0, 0.0]);

    // Bottom edge + bottom tabs (going right)
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

    // Right edge: bottom → top
    pts.push([105.0, 15.0]);

    // Top edge + top tabs (going left)
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
    // Polygon closes implicitly: earcutr connects last point (4, 15) back to (0, 15).
    pts
}

// Builds a float<->int adapter whose bounding box encloses every input ring (plus a margin).
// Every boolean op shares this one adapter so that identical geometry snaps to identical 
// integers and therefore yields vertices -> guarantees that independently triangulated caps,
// edges and walls meet without cracks -> watertight mesh without holes
fn make_adapter(groups: &[&[Vec<[f64; 2]>]]) -> FloatPointAdapter<[f64; 2], i32> {
    let (mut min_x, mut min_y) = (f64::INFINITY, f64::INFINITY);
    let (mut max_x, mut max_y) = (f64::NEG_INFINITY, f64::NEG_INFINITY);
    for group in groups {
        for ring in *group {
            for &[x, y] in ring {
                min_x = min_x.min(x);
                min_y = min_y.min(y);
                max_x = max_x.max(x);
                max_y = max_y.max(y);
            }
        }
    }
    if !min_x.is_finite() {
        return FloatPointAdapter::new(FloatRect::new(-1.0, 1.0, -1.0, 1.0));
    }
    let m = 1.0;
    FloatPointAdapter::new(FloatRect::new(min_x - m, max_x + m, min_y - m, max_y + m))
}

// Runs one 2D boolean operation through the shared adapter and returns the resulting shapes
// (each shape = one CCW outer contour followed by its CW hole contours).
fn boolean(
    adapter: &FloatPointAdapter<[f64; 2], i32>,
    subj: &[Vec<[f64; 2]>],
    clip: &[Vec<[f64; 2]>],
    rule: OverlayRule,
) -> Shapes<[f64; 2]> {
    let mut options = OverlayOptions::<f64, i32>::default();
    // Keep collinear output vertices: a channel edge crossing a port circle lands mid-chord on
    // the circle (collinear with its two segment endpoints), and that split point must survive
    // in every operation's output so the port wall in slab B matches the arc in slab A,
    // genuinely degenerate spikes/duplicates are still removed by clean_result.
    options.preserve_output_collinear = true;
    options.clean_result = true;

    let capacity = subj.iter().chain(clip).map(|c| c.len()).sum::<usize>().max(4);
    let mut overlay = FloatOverlay::<[f64; 2], i32>::new_custom(
        adapter.clone(),
        options,
        Solver::default(),
        capacity,
    );
    for c in subj {
        overlay = overlay.unsafe_add_contour(c, ShapeType::Subject);
    }
    for c in clip {
        overlay = overlay.unsafe_add_contour(c, ShapeType::Clip);
    }
    overlay.overlay(rule, FillRule::NonZero)
}

// Triangulates one shape (outer CCW + CW holes, as emitted by i_overlay) into a horizontal
// face at height z. flip=true reverses the winding so the normal points toward -Z (used for
// the board's bottom cap) instead of +Z.
fn add_cap(tris: &mut Vec<Triangle>, shape: &Shape<[f64; 2]>, z: f64, flip: bool) {
    if shape.is_empty() {
        return;
    }
    let mut data: Vec<f64> = Vec::new();
    let mut hole_indices: Vec<usize> = Vec::new();
    for (i, contour) in shape.iter().enumerate() {
        if i > 0 {
            hole_indices.push(data.len() / 2);
        }
        for p in contour {
            data.push(p[0]);
            data.push(p[1]);
        }
    }
    let pts: Vec<[f64; 2]> = data.chunks(2).map(|c| [c[0], c[1]]).collect();
    for t in earcutr::earcut(&data, &hole_indices, 2).unwrap_or_default().chunks(3) {
        let (a, b, c) = (pts[t[0]], pts[t[1]], pts[t[2]]);
        if flip {
            tris.push(Triangle::new(xy(a, z), xy(c, z), xy(b, z)));
        } else {
            tris.push(Triangle::new(xy(a, z), xy(b, z), xy(c, z)));
        }
    }
}

// Extrudes every contour of a shape into vertical walls from z_top down to z_bot. i_overlay
// emits contours with the solid region on the left of each directed edge (CCW outer, CW
// holes), so this single fixed winding always produces an outward-facing wall.
fn add_walls(tris: &mut Vec<Triangle>, shape: &Shape<[f64; 2]>, z_top: f64, z_bot: f64) {
    for contour in shape {
        let n = contour.len();
        if n < 2 {
            continue;
        }
        for i in 0..n {
            let p0 = contour[i];
            let p1 = contour[(i + 1) % n];
            tris.push(Triangle::new(xy(p0, z_top), xy(p0, z_bot), xy(p1, z_bot)));
            tris.push(Triangle::new(xy(p0, z_top), xy(p1, z_bot), xy(p1, z_top)));
        }
    }
}

// Generates the final, watertight, two-manifold binary STL of the routing board (bt = board thickness)
//
// The model is the board − channel pockets − through holes (ports + screw holes).
// It is built as two stacked slabs that share a horizontal interface at Z = −channel_height (ch):
//   
//   * top slab has Z-coords in [−ch, 0]  = board − channels − ports − screws
//   * bottom slab has Z-coords in [−bt, −ch] = board − ports − screws
// 
// from which the exposed surfaces are:
//   * top cap    = A at Z = 0       (normal +Z)
//   * bottom cap = B at Z = −bt      (normal −Z)
//   * ledge      = (B − A) at Z = −ch = the channel floors with ports punched through (+Z)
//   * walls      = vertical extrusions of every contour of A (0 -> −ch) and of B (−ch -> −bt)
//
// A port (which is typically wider than the channel) is therefore a full-depth through hole whose wall
// is the channel-side arc only down to the floor and the full circle below it

pub fn generate_stl(input: GenerateSTLInput) -> GenerateSTLOutput {
    let bw = input.board_width;
    let bh = input.board_height;
    let bt = input.board_thickness;
    let ch = input.channel_height;
    let pr = input.port_diameter / 2.0;

    // Channel outlines (CCW, Y-up) and the port positions at their endpoints.
    let mut channels: Vec<Vec<[f64; 2]>> = Vec::new();
    let mut all_ports: Vec<[f64; 2]> = Vec::new();
    for (_, connection) in &input.connections.connections {
        let outline = match octilinear_outline(connection, input.channel_width, &input.channel_cap) {
            Polyline::Closed(pts) | Polyline::Open(pts) => transform_y(pts, bh),
        };
        channels.push(as_ccw(outline));

        if connection.len() == 1 {
            let ch_pts = &connection[0];
            if let Some(&[x, y]) = ch_pts.first() {
                all_ports.push([x, bh - y]);
            }
            if ch_pts.len() > 1 {
                if let Some(&[x, y]) = ch_pts.last() {
                    all_ports.push([x, bh - y]);
                }
            }
        } else {
            if let Some(first_ch) = connection.first() {
                if let Some(&[x, y]) = first_ch.first() {
                    all_ports.push([x, bh - y]);
                }
            }
            for branch in connection.iter() {
                if let Some(&[x, y]) = branch.last() {
                    all_ports.push([x, bh - y]);
                }
            }
        }
    }

    // Deduplicate coincident ports, then turn each into a CCW circle contour.
    all_ports.sort_by(|a, b| {
        a[0].partial_cmp(&b[0])
            .unwrap()
            .then(a[1].partial_cmp(&b[1]).unwrap())
    });
    all_ports.dedup_by(|a, b| (a[0] - b[0]).abs() < 1e-6 && (a[1] - b[1]).abs() < 1e-6);
    let ports: Vec<Vec<[f64; 2]>> = all_ports
        .iter()
        .map(|&[cx, cy]| circle_ccw(cx, cy, pr))
        .collect();

    // Board outline (CCW) and the screw holes (template only).
    let (board_outline, screws): (Vec<[f64; 2]>, Vec<Vec<[f64; 2]>>) = if input.is_template {
        let screws = TEMPLATE_SCREW_HOLE_CENTERS
            .iter()
            .map(|&[cx, cy]| circle_ccw(cx, cy, TEMPLATE_SCREW_HOLE_RADIUS))
            .collect();
        (as_ccw(template_board_outline()), screws)
    } else {
        (vec![[0., 0.], [bw, 0.], [bw, bh], [0., bh]], Vec::new())
    };

    let board = [board_outline];
    let adapter = make_adapter(&[&board, &channels, &ports, &screws]);

    // Through-going holes (ports + screw holes) are removed from both slabs.
    let mut through: Vec<Vec<[f64; 2]>> = ports.clone();
    through.extend(screws.iter().cloned());

    // Top slab A = board − channels − through.
    let mut clip_a = channels.clone();
    clip_a.extend(through.iter().cloned());
    let shape_a = boolean(&adapter, &board, &clip_a, OverlayRule::Difference);

    // Bottom slab B = (board union channels) − through. Channels are added to the subject (they are
    // solid material this far down) only so that the port circles get split at the channel
    // crossings exactly as they are in A.
    let mut subj_b = board.to_vec();
    subj_b.extend(channels.iter().cloned());
    let shape_b = boolean(&adapter, &subj_b, &through, OverlayRule::Difference);

    // Ledge = channels − ports: the channel floors at Z = −ch with the ports punched through.
    let shape_l = boolean(&adapter, &channels, &ports, OverlayRule::Difference);

    let mut tris: Vec<Triangle> = Vec::new();
    for shape in &shape_a {
        add_cap(&mut tris, shape, 0., false);
        add_walls(&mut tris, shape, 0., -ch);
    }
    for shape in &shape_b {
        add_cap(&mut tris, shape, -bt, true);
        add_walls(&mut tris, shape, -ch, -bt);
    }
    for shape in &shape_l {
        add_cap(&mut tris, shape, -ch, false);
    }
    GenerateSTLOutput(write_binary_stl(&tris))
}