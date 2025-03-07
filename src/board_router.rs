use core::f64;
use serde::{Deserialize, Serialize};
use std::{
    cmp::Ordering,
    collections::{HashMap, HashSet, VecDeque},
};

use crate::graph_search::{a_star, AStarNode};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RouteInput {
    pub channel_width: f64,
    pub channel_spacing: f64,
    pub layout: Layout,
    pub board_width: f64,
    pub board_height: f64,
    pub pitch: f64,
    pub pitch_offset_x: f64,
    pub pitch_offset_y: f64,
    pub port_diameter: f64,
    pub max_ports: usize,
    pub connections: RouteInputConnections,
}

pub type ConnectionID = usize;
pub type RouteInputConnections = Vec<RouteInputConnection>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteInputConnection {
    pub id: ConnectionID, 
    pub ports: Vec<Port>,
    pub branch_port: Option<Port>
}
pub type Port = (usize, usize);

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub enum Layout {
    Rectilinear,
    Octilinear,
    Mixed,
}

pub type BoardRouterOutput = Result<BoardRouterOutputBoard, BoardRouterOutputError>;

#[derive(Debug, Serialize, Deserialize)]
pub enum BoardRouterOutputError {
    NoInputConnections,
    PartialResult(BoardRouterOutputBoard),
    NoConnectionsFound,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BoardRouterOutputBoard {
    pub connections: Vec<BoardRouterOutputConnection>, // this is the output -- a vector of the channel connections on the routing board
}

pub type BoardRouterOutputConnection = (ConnectionID, Vec<Channel>); // tuple of connection ID (unsigned integer) and channel(s), the channel consists of a vector of points

pub type Channel = Vec<Point>;

pub type Point = [f64; 2]; // a point in 2D (x, y)

#[derive(Debug)]
struct GridNode {
    id: usize,
    ix: usize,
    iy: usize,
    x: f64,
    y: f64,
    connection: Option<usize>,
    blocked: bool,
    multi_connection: Option<usize>, // can have multiple connections
}

impl PartialEq for GridNode {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

#[inline]
fn left_if_exists(v: (usize, usize)) -> Option<((usize, usize), f64)> {
    if 0 <= v.0 as isize - 1 {
        Some(((v.0 - 1, v.1), 1.0))
    } else {
        None
    }
}

#[inline]
fn right_if_exists(v: (usize, usize), x_upper: usize) -> Option<((usize, usize), f64)> {
    if v.0 + 1 < x_upper {
        Some(((v.0 + 1, v.1), 1.0))
    } else {
        None
    }
}

#[inline]
fn up_if_exists(v: (usize, usize)) -> Option<((usize, usize), f64)> {
    if 0 <= v.1 as isize - 1 {
        Some(((v.0, v.1 - 1), 1.0))
    } else {
        None
    }
}

#[inline]
fn down_if_exists(v: (usize, usize), y_upper: usize) -> Option<((usize, usize), f64)> {
    if v.1 + 1 < y_upper {
        Some(((v.0, v.1 + 1), 1.0))
    } else {
        None
    }
}

#[inline]
fn left_up_if_exists(v: (usize, usize)) -> Option<((usize, usize), f64)> {
    if 0 <= v.0 as isize - 1 && 0 <= v.1 as isize - 1 {
        Some(((v.0 - 1, v.1 - 1), f64::consts::SQRT_2))
    } else {
        None
    }
}

#[inline]
fn left_down_if_exists(v: (usize, usize), y_upper: usize) -> Option<((usize, usize), f64)> {
    if 0 <= v.0 as isize - 1 && v.1 + 1 < y_upper {
        Some(((v.0 - 1, v.1 + 1), f64::consts::SQRT_2))
    } else {
        None
    }
}

#[inline]
fn right_up_if_exists(v: (usize, usize), x_upper: usize) -> Option<((usize, usize), f64)> {
    if v.0 + 1 < x_upper && 0 <= v.1 as isize - 1 {
        Some(((v.0 + 1, v.1 - 1), f64::consts::SQRT_2))
    } else {
        None
    }
}

#[inline]
fn right_down_if_exists(
    v: (usize, usize),
    x_upper: usize,
    y_upper: usize,
) -> Option<((usize, usize), f64)> {
    if v.0 + 1 < x_upper && v.1 + 1 < y_upper {
        Some(((v.0 + 1, v.1 + 1), f64::consts::SQRT_2))
    } else {
        None
    }
}

fn neighbors(c: (usize, usize), cells_x: usize, cells_y: usize) -> Vec<((usize, usize), f64)> {
    let n = [
        right_if_exists(c, cells_x),
        up_if_exists(c),
        left_if_exists(c),
        down_if_exists(c, cells_y),
        right_up_if_exists(c, cells_x),
        left_up_if_exists(c),
        left_down_if_exists(c, cells_y),
        right_down_if_exists(c, cells_x, cells_y),
    ];
    n.into_iter()
        .filter_map(|e| if e.is_some() { e } else { None })
        .collect()
}

#[inline]
fn compute_extra_node(
    nodes: &[GridNode],
    ports: &[Port],
    cells_x: usize,
    cells_y: usize,
    port_cell: impl Fn(&(usize, usize)) -> (usize, usize)
) -> Option<(usize, usize)> {
    // Compute centroid
    let s = ports.iter().copied().fold((0, 0), |a, p| {
        let (port_cell_x, port_cell_y) = port_cell(&p);
        (
            a.0 + nodes[port_cell_x * cells_y + port_cell_y].ix,
            a.1 + nodes[port_cell_x * cells_y + port_cell_y].iy,
        )
    });
    let center = (s.0 / ports.len(), s.1 / ports.len());

    let mut open = VecDeque::from([center.0 * cells_y + center.1]);
    let mut closed = HashSet::<usize>::new();

    loop {
        let e = open.pop_front();
        if let Some(candidate) = e {
            if !closed.contains(&candidate) {
                closed.insert(candidate);
                let candidate_indices = (nodes[candidate].ix, nodes[candidate].iy);
                let neighbors = neighbors(candidate_indices, cells_x, cells_y);
                let mut ring = Vec::from_iter(neighbors.iter());
                let candidate_cell = &(candidate_indices, 0.);
                ring.push(candidate_cell);

                // Check if neighbors are already occupied by ports or multi-connection joints
                let unoccupied = ring.iter().all(|n| {
                    let node = &nodes[n.0 .0 * cells_y + n.0 .1];
                    let n_connection = node.connection;
                    let n_multi_connection = node.multi_connection;

                    return n_connection.is_none() && n_multi_connection.is_none() && !node.blocked;
                });

                if unoccupied {
                    return Some(candidate_indices);
                }

                neighbors
                    .into_iter()
                    .for_each(|n| open.push_back(n.0 .0 * cells_y + n.0 .1));
            }
        } else {
            break;
        }
    }
    None
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComputePortsInput {
    pub board_width: f64,
    pub board_height: f64,
    pub pitch: f64,
    pub pitch_offset_x: f64,
    pub pitch_offset_y: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComputePortsOutput {
    pub ports_x: usize,
    pub ports_y: usize,
}

pub fn compute_ports(
    ComputePortsInput {
        board_width,
        board_height,
        pitch,
        pitch_offset_x,
        pitch_offset_y,
    }: ComputePortsInput,
) -> ComputePortsOutput {
    let ports_x = ((board_width - 2. * pitch_offset_x) / pitch).floor() as usize + 1;
    let ports_y = ((board_height - 2. * pitch_offset_y) / pitch).floor() as usize + 1;
    return ComputePortsOutput { ports_x, ports_y };
}

pub fn route(input: &RouteInput) -> BoardRouterOutput {
    let channel_distance = input.channel_width + input.channel_spacing;
    let cells_per_pitch = (input.pitch / channel_distance).floor() as usize;
    let cell_size = input.pitch / (cells_per_pitch as f64);
    let half_cell_size = cell_size / 2.;
    let ComputePortsOutput { ports_x, ports_y } = compute_ports(ComputePortsInput {
        board_width: input.board_width,
        board_height: input.board_height,
        pitch: input.pitch,
        pitch_offset_x: input.pitch_offset_x,
        pitch_offset_y: input.pitch_offset_y,
    });
    let main_grid_cells_x = ports_x * cells_per_pitch + (1 - cells_per_pitch % 2);
    let main_grid_cells_y = ports_y * cells_per_pitch + (1 - cells_per_pitch % 2);

    let half_spacing = input.channel_spacing / 2.;
    let pre_remaining_x = input.pitch_offset_x
        - ((cells_per_pitch / 2) as f64) * cell_size
        - half_cell_size
        - half_spacing;
    let pre_offset_cells_x = ((pre_remaining_x / cell_size).max(0.)).floor() as usize;

    let pre_remaining_y = input.pitch_offset_y
        - ((cells_per_pitch / 2) as f64) * cell_size
        - half_cell_size
        - half_spacing;
    let pre_offset_cells_y = ((pre_remaining_y / cell_size).max(0.)).floor() as usize;

    let post_remaining_x = input.pitch_offset_x
        - ((cells_per_pitch / 2) as f64) * cell_size
        - half_cell_size
        - half_spacing;
    let post_offset_cells_x = ((post_remaining_x / cell_size).max(0.)).floor() as usize;

    let post_remaining_y = input.pitch_offset_y
        - ((cells_per_pitch / 2) as f64) * cell_size
        - half_cell_size
        - half_spacing;
    let post_offset_cells_y = ((post_remaining_y / cell_size).max(0.)).floor() as usize;

    let cells_x = main_grid_cells_x + pre_offset_cells_x + post_offset_cells_x;
    let cells_y = main_grid_cells_y + pre_offset_cells_y + post_offset_cells_y;

    let cell_offset_x = input.pitch_offset_x
        - ((cells_per_pitch / 2) as f64) * cell_size
        - pre_offset_cells_x as f64 * cell_size;
    let cell_offset_y = input.pitch_offset_y
        - ((cells_per_pitch / 2) as f64) * cell_size
        - pre_offset_cells_y as f64 * cell_size;

    let port_cell = |port: &Port| {
        let cell_x = (cells_per_pitch / 2) + cells_per_pitch * port.0 + pre_offset_cells_x;
        let cell_y = (cells_per_pitch / 2) + cells_per_pitch * port.1 + pre_offset_cells_y;
        (cell_x, cell_y)
    };

    let port_radius = input.port_diameter / 2.;
    let port_influence_radius = port_radius + input.channel_spacing + input.channel_width / 2.;
    let box_size = (port_influence_radius / cell_size).ceil();

    let mut nodes = Vec::<GridNode>::new();

    // Generate routing nodes/cells
    for x in 0..cells_x {
        for y in 0..cells_y {
            nodes.push(GridNode {
                id: (x * cells_y + y) as usize,
                ix: x,
                iy: y,
                x: cell_offset_x + x as f64 * cell_size,
                y: cell_offset_y + y as f64 * cell_size,
                connection: None,
                blocked: false,
                multi_connection: None,
            });
        }
    }

    let input_connections = input
        .connections
        .to_vec()
        .into_iter()
        .collect::<Vec<RouteInputConnection>>();

    // Reserve cells at and around used ports for the corresponding connection only (prevent other connections from crossing foreign ports)
    for input_connection in input_connections.iter() {
        let RouteInputConnection { id: c_id, ports, .. } = input_connection;
        for port in ports {
            let (cell_x, cell_y) = port_cell(port);

            let node_position = (
                nodes[cell_x * cells_y + cell_y].x,
                nodes[cell_x * cells_y + cell_y].y,
            );

            for box_x in usize::saturating_sub(cell_x, box_size as usize)
                ..(cell_x + 1 + box_size as usize).clamp(0, cells_x)
            {
                for box_y in usize::saturating_sub(cell_y, box_size as usize)
                    ..(cell_y + 1 + box_size as usize).clamp(0, cells_y)
                {
                    let box_node_position = (
                        nodes[box_x * cells_y + box_y].x,
                        nodes[box_x * cells_y + box_y].y,
                    );
                    let distance = f64::hypot(
                        box_node_position.0 - node_position.0,
                        box_node_position.1 - node_position.1,
                    );
                    if distance < port_influence_radius {
                        let node = &mut nodes[box_x * cells_y + box_y];
                        // If the cell is already reserved for another connection (e.g., ports close to each other), no connection can be routed through this cell
                        if node.connection.is_none()
                            || (node.connection.is_some() && node.connection.unwrap() == *c_id)
                        {
                            node.connection = Some(*c_id);
                        } else {
                            nodes[box_x * cells_y + box_y].blocked = true;
                        }
                    }
                }
            }
        }
    }

    let mut join_nodes = HashMap::<ConnectionID, (usize, usize)>::new();

    for input_connection in input_connections.iter() {
        let RouteInputConnection { id: c_id, ports, branch_port } = input_connection;
        if ports.len() > 2 {
            // there are more than 2 nodes connected, so we connect them in a star like structure
            // define the center node
            let center_node = if branch_port.is_some() {
                Some(port_cell(&branch_port.unwrap()))
            } else {
                compute_extra_node(&nodes, ports, cells_x, cells_y, port_cell)
            };

            if let Some(node) = center_node {
                let id = node.0 * cells_y + node.1;
                nodes[id].multi_connection = Some(*c_id);
                join_nodes.insert(*c_id, node);
            }
        } else {
            if branch_port.is_some() {
                let node = port_cell(&branch_port.unwrap());
                let id = node.0 * cells_y + node.1;
                nodes[id].multi_connection = Some(*c_id);
                join_nodes.insert(*c_id, node);
            }
        }
    }

    enum RoutingConnection {
        PortToPort(PortToPort),
        StarBranch(StarBranch),
    }

    struct PortToPort {
        connection: usize,
        from_cell: (usize, usize),
        to_cell: (usize, usize),
    }

    // 2-port connections with a branch_port are also regarded as two StarBranch'es
    struct StarBranch {
        connection: usize,
        from_cell: Option<(usize, usize)>,
        to_cell: (usize, usize),
        num_branches: usize,
    }

    let mut routing_connections = Vec::new();
    for input_connection in input_connections.iter() {
        let RouteInputConnection { id: c_id, ports, .. } = input_connection;
        if ports.len() == 2 {
            if join_nodes.contains_key(c_id) {
                routing_connections.push(RoutingConnection::StarBranch(StarBranch {
                    connection: *c_id,
                    from_cell: join_nodes.get(&c_id).copied(),
                    to_cell: port_cell(&ports[0]),
                    num_branches: ports.len(),
                }));

                routing_connections.push(RoutingConnection::StarBranch(StarBranch {
                    connection: *c_id,
                    from_cell: join_nodes.get(&c_id).copied(),
                    to_cell: port_cell(&ports[1]),
                    num_branches: ports.len(),
                }));
            } else {
                routing_connections.push(RoutingConnection::PortToPort(PortToPort {
                    connection: *c_id,
                    from_cell: port_cell(&ports[0]),
                    to_cell: port_cell(&ports[1]),
                }));
            }
        } else if ports.len() > 2 {
            for port in ports.iter() {
                routing_connections.push(RoutingConnection::StarBranch(StarBranch {
                    connection: *c_id,
                    from_cell: join_nodes.get(&c_id).copied(),
                    to_cell: port_cell(port),
                    num_branches: ports.len(),
                }));
            }
        } else {
            panic!()
        }
    }
    let n_routing_connections = routing_connections.len();

    // Sort connections by multi-connections and direct distance, ascending
    fn cmp_connections(a: &RoutingConnection, b: &RoutingConnection) -> Ordering {
        match (a, b) {
            (
                RoutingConnection::PortToPort(a_port_to_port),
                RoutingConnection::PortToPort(b_port_to_port),
            ) => {
                let adx = usize::abs_diff(a_port_to_port.from_cell.0, a_port_to_port.to_cell.0);
                let ady = usize::abs_diff(a_port_to_port.from_cell.1, a_port_to_port.to_cell.1);
                let bdx = usize::abs_diff(b_port_to_port.from_cell.0, b_port_to_port.to_cell.0);
                let bdy = usize::abs_diff(b_port_to_port.from_cell.1, b_port_to_port.to_cell.1);

                let al = f64::hypot(adx as f64, ady as f64);
                let bl = f64::hypot(bdx as f64, bdy as f64);
                return f64::partial_cmp(&al, &bl).unwrap();
            }
            (RoutingConnection::PortToPort(_), RoutingConnection::StarBranch(_)) => {
                return Ordering::Greater
            }
            (RoutingConnection::StarBranch(_), RoutingConnection::PortToPort(_)) => {
                return Ordering::Less
            }
            (
                RoutingConnection::StarBranch(a_star_branch),
                RoutingConnection::StarBranch(b_star_branch),
            ) => {
                let cmp_num_branches =
                    usize::cmp(&a_star_branch.num_branches, &b_star_branch.num_branches);
                match cmp_num_branches {
                    Ordering::Equal => {
                        if a_star_branch.from_cell.is_none() || b_star_branch.from_cell.is_none() {
                            return Ordering::Equal; // Don't care
                        }
                        let adx = usize::abs_diff(
                            a_star_branch.from_cell.unwrap().0,
                            a_star_branch.to_cell.0,
                        );
                        let ady = usize::abs_diff(
                            a_star_branch.from_cell.unwrap().1,
                            a_star_branch.to_cell.1,
                        );
                        let bdx = usize::abs_diff(
                            b_star_branch.from_cell.unwrap().0,
                            b_star_branch.to_cell.0,
                        );
                        let bdy = usize::abs_diff(
                            b_star_branch.from_cell.unwrap().1,
                            b_star_branch.to_cell.1,
                        );

                        let al = f64::hypot(adx as f64, ady as f64);
                        let bl = f64::hypot(bdx as f64, bdy as f64);
                        return f64::partial_cmp(&al, &bl).unwrap();
                    }
                    o => return o,
                }
            }
        }
    }

    routing_connections.sort_by(&cmp_connections);
    let mut output_connections = Vec::<BoardRouterOutputConnection>::new();

    if routing_connections.len() == 0 {
        return Err(BoardRouterOutputError::NoInputConnections);
    }

    let mut succesful_routings = 0;

    // Route connections sequentially
    for routing_connection in routing_connections {
        let (c_id, ax, ay, bx, by);

        match &routing_connection {
            RoutingConnection::PortToPort(port_to_port) => {
                c_id = port_to_port.connection;
                (ax, ay) = port_to_port.from_cell;
                (bx, by) = port_to_port.to_cell;
            }
            RoutingConnection::StarBranch(star_branch) => {
                c_id = star_branch.connection;
                if star_branch.from_cell.is_some() {
                    (ax, ay) = star_branch.from_cell.unwrap();
                    (bx, by) = star_branch.to_cell;
                } else {
                    continue;
                }
            }
        }

        let start_node_id = ax * cells_y + ay;
        let target_node_id = bx * cells_y + by;
        let target_node = &nodes[target_node_id];

        // Setup successor cell functions for rectilinear, octilinear, etc; Since they capture some variables (e.g., cells_x/y), they need to be defined here.
        let rectilinear = |a: &AStarNode<(usize, Option<usize>)>| -> Vec<((usize, Option<usize>), f64)> {
            let current = a.node.0;
            let n = &nodes[current];
            let options = match a.node.1 {
                Some(previous) => {
                    let p = &nodes[previous];
                    if p.ix < n.ix {
                        Vec::from([
                            up_if_exists((n.ix, n.iy)),
                            down_if_exists((n.ix, n.iy), cells_y),
                            right_if_exists((n.ix, n.iy), cells_x),
                        ])
                    } else if p.ix > n.ix {
                        Vec::from([
                            up_if_exists((n.ix, n.iy)),
                            down_if_exists((n.ix, n.iy), cells_y),
                            left_if_exists((n.ix, n.iy)),
                        ])
                    } else if p.iy < n.iy {
                        Vec::from([
                            down_if_exists((n.ix, n.iy), cells_y),
                            left_if_exists((n.ix, n.iy)),
                            right_if_exists((n.ix, n.iy), cells_x),
                        ])
                    } else if p.iy > n.iy {
                        Vec::from([
                            up_if_exists((n.ix, n.iy)),
                            left_if_exists((n.ix, n.iy)),
                            right_if_exists((n.ix, n.iy), cells_x),
                        ])
                    } else {
                        panic!()
                    }
                }
                None => Vec::from([
                    down_if_exists((n.ix, n.iy), cells_y),
                    up_if_exists((n.ix, n.iy)),
                    left_if_exists((n.ix, n.iy)),
                    right_if_exists((n.ix, n.iy), cells_x),
                ]),
            };

            // Check whether the cell can be reached (is unblocked)
            options
                .into_iter()
                .filter_map(|o| -> Option<((usize, Option<usize>), f64)> {
                    match o {
                        Some(((x, y), c)) => {
                            let cell_id = x * cells_y + y;
                            let node = &nodes[cell_id];
                            if let Some(c) = node.connection {
                                if c != c_id {
                                    return None;
                                }
                            }
                            if let Some(c) = node.multi_connection {
                                if c != c_id {
                                    return None;
                                }
                            }
                            if node.blocked {
                                return None;
                            }
                            Some(((cell_id, Some(current)), c))
                        }
                        _ => None,
                    }
                })
                .collect()
        };

        let octilinear = |a: &AStarNode<(usize, Option<usize>)>| -> Vec<((usize, Option<usize>), f64)> {
            let current = a.node.0;
            let n = &nodes[current];
            let options = match a.node.1 {
                Some(previous) => {
                    let p = &nodes[previous];
                    if p.ix < n.ix {
                        if p.iy < n.iy {
                            Vec::from([
                                down_if_exists((n.ix, n.iy), cells_y),
                                right_down_if_exists((n.ix, n.iy), cells_x, cells_y),
                                right_if_exists((n.ix, n.iy), cells_x),
                            ])
                        } else if p.iy > n.iy {
                            Vec::from([
                                up_if_exists((n.ix, n.iy)),
                                right_up_if_exists((n.ix, n.iy), cells_x),
                                right_if_exists((n.ix, n.iy), cells_x),
                            ])
                        } else {
                            Vec::from([
                                right_up_if_exists((n.ix, n.iy), cells_x),
                                right_down_if_exists((n.ix, n.iy), cells_x, cells_y),
                                right_if_exists((n.ix, n.iy), cells_x),
                            ])
                        }
                    } else if p.ix > n.ix {
                        if p.iy < n.iy {
                            Vec::from([
                                down_if_exists((n.ix, n.iy), cells_y),
                                left_down_if_exists((n.ix, n.iy), cells_y),
                                left_if_exists((n.ix, n.iy)),
                            ])
                        } else if p.iy > n.iy {
                            Vec::from([
                                up_if_exists((n.ix, n.iy)),
                                left_up_if_exists((n.ix, n.iy)),
                                left_if_exists((n.ix, n.iy)),
                            ])
                        } else {
                            Vec::from([
                                left_up_if_exists((n.ix, n.iy)),
                                left_down_if_exists((n.ix, n.iy), cells_y),
                                left_if_exists((n.ix, n.iy)),
                            ])
                        }
                    } else if p.iy < n.iy {
                        Vec::from([
                            down_if_exists((n.ix, n.iy), cells_y),
                            left_down_if_exists((n.ix, n.iy), cells_y),
                            right_down_if_exists((n.ix, n.iy), cells_x, cells_y),
                        ])
                    } else if p.iy > n.iy {
                        Vec::from([
                            up_if_exists((n.ix, n.iy)),
                            left_up_if_exists((n.ix, n.iy)),
                            right_up_if_exists((n.ix, n.iy), cells_x),
                        ])
                    } else {
                        panic!()
                    }
                }
                None => Vec::from([
                    down_if_exists((n.ix, n.iy), cells_y),
                    left_down_if_exists((n.ix, n.iy), cells_y),
                    right_down_if_exists((n.ix, n.iy), cells_x, cells_y),
                    up_if_exists((n.ix, n.iy)),
                    left_up_if_exists((n.ix, n.iy)),
                    right_up_if_exists((n.ix, n.iy), cells_x),
                    left_if_exists((n.ix, n.iy)),
                    right_if_exists((n.ix, n.iy), cells_x),
                ]),
            };

            // Check whether the cell can be reached (is unblocked, and for diagonal connections, diagonal neighbors are unblocked)
            options
                .into_iter()
                .filter_map(|o| -> Option<((usize, Option<usize>), f64)> {
                    match o {
                        Some(((x, y), c)) => {
                            let cell_id = x * cells_y + y;
                            let node = &nodes[cell_id];
                            if let Some(c) = node.connection {
                                if c != c_id {
                                    return None;
                                }
                            }
                            if let Some(c) = node.multi_connection {
                                if c != c_id {
                                    return None;
                                }
                            }
                            if node.blocked {
                                return None;
                            }
                            if n.ix != x && n.iy != y {
                                let block_a_id = n.ix * cells_y + y;
                                let node_a = &nodes[block_a_id];
                                if let Some(c) = node_a.connection {
                                    if c != c_id {
                                        return None;
                                    }
                                }
                                if node_a.blocked && node_a.multi_connection.is_none() {
                                    return None;
                                }

                                let block_b_id = x * cells_y + n.iy;
                                let node_b = &nodes[block_b_id];
                                if let Some(c) = node_b.connection {
                                    if c != c_id {
                                        return None;
                                    }
                                }
                                if node_b.blocked && node_b.multi_connection.is_none() {
                                    return None;
                                }
                            }
                            Some(((cell_id, Some(current)), c))
                        }
                        _ => None,
                    }
                })
                .collect()
        };

        // Not used currently, not up to date
        let mixed = |a: &AStarNode<(usize, Option<usize>)>| -> Vec<((usize, Option<usize>), f64)> {
            let current = a.node.0;
            let n = &nodes[current];
            let options = match a.node.1 {
                Some(previous) => {
                    let p = &nodes[previous];
                    if p.ix < n.ix {
                        if p.iy < n.iy {
                            Vec::from([
                                down_if_exists((n.ix, n.iy), cells_y),
                                right_down_if_exists((n.ix, n.iy), cells_x, cells_y),
                                right_if_exists((n.ix, n.iy), cells_x),
                                right_up_if_exists((n.ix, n.iy), cells_x),
                                left_down_if_exists((n.ix, n.iy), cells_y),
                            ])
                        } else if p.iy > n.iy {
                            Vec::from([
                                up_if_exists((n.ix, n.iy)),
                                right_up_if_exists((n.ix, n.iy), cells_x),
                                right_if_exists((n.ix, n.iy), cells_x),
                                right_down_if_exists((n.ix, n.iy), cells_x, cells_y),
                                left_up_if_exists((n.ix, n.iy)),
                            ])
                        } else {
                            Vec::from([
                                right_up_if_exists((n.ix, n.iy), cells_x),
                                right_down_if_exists((n.ix, n.iy), cells_x, cells_y),
                                right_if_exists((n.ix, n.iy), cells_x),
                                up_if_exists((n.ix, n.iy)),
                                down_if_exists((n.ix, n.iy), cells_y),
                            ])
                        }
                    } else if p.ix > n.ix {
                        if p.iy < n.iy {
                            Vec::from([
                                down_if_exists((n.ix, n.iy), cells_y),
                                left_down_if_exists((n.ix, n.iy), cells_y),
                                left_if_exists((n.ix, n.iy)),
                                left_up_if_exists((n.ix, n.iy)),
                                right_down_if_exists((n.ix, n.iy), cells_x, cells_y),
                            ])
                        } else if p.iy > n.iy {
                            Vec::from([
                                up_if_exists((n.ix, n.iy)),
                                left_up_if_exists((n.ix, n.iy)),
                                left_if_exists((n.ix, n.iy)),
                                right_up_if_exists((n.ix, n.iy), cells_x),
                                left_down_if_exists((n.ix, n.iy), cells_y),
                            ])
                        } else {
                            Vec::from([
                                left_up_if_exists((n.ix, n.iy)),
                                left_down_if_exists((n.ix, n.iy), cells_y),
                                left_if_exists((n.ix, n.iy)),
                                up_if_exists((n.ix, n.iy)),
                                down_if_exists((n.ix, n.iy), cells_y),
                            ])
                        }
                    } else if p.iy < n.iy {
                        Vec::from([
                            down_if_exists((n.ix, n.iy), cells_y),
                            left_down_if_exists((n.ix, n.iy), cells_y),
                            right_down_if_exists((n.ix, n.iy), cells_x, cells_y),
                            left_if_exists((n.ix, n.iy)),
                            right_if_exists((n.ix, n.iy), cells_x),
                        ])
                    } else if p.iy > n.iy {
                        Vec::from([
                            up_if_exists((n.ix, n.iy)),
                            left_up_if_exists((n.ix, n.iy)),
                            right_up_if_exists((n.ix, n.iy), cells_x),
                            left_if_exists((n.ix, n.iy)),
                            right_if_exists((n.ix, n.iy), cells_x),
                        ])
                    } else {
                        panic!()
                    }
                }
                None => Vec::from([
                    down_if_exists((n.ix, n.iy), cells_y),
                    left_down_if_exists((n.ix, n.iy), cells_y),
                    right_down_if_exists((n.ix, n.iy), cells_x, cells_y),
                    up_if_exists((n.ix, n.iy)),
                    left_up_if_exists((n.ix, n.iy)),
                    right_up_if_exists((n.ix, n.iy), cells_x),
                    left_if_exists((n.ix, n.iy)),
                    right_if_exists((n.ix, n.iy), cells_x),
                ]),
            };

            // Check whether the cell can be reached (is unblocked, and for diagonal connections, diagonal neighbors are unblocked)
            options
                .into_iter()
                .filter_map(|o| -> Option<((usize, Option<usize>), f64)> {
                    match o {
                        Some(((x, y), c)) => {
                            let cell_id = x * cells_y + y;
                            let node = &nodes[cell_id];
                            if let Some(c) = node.connection {
                                if c != c_id {
                                    return None;
                                }
                            }
                            if node.blocked {
                                return None;
                            }
                            if n.ix != x && n.iy != y {
                                let block_a_id = n.ix * cells_y + y;
                                let node_a = &nodes[block_a_id];
                                if let Some(c) = node_a.connection {
                                    if c != c_id {
                                        return None;
                                    }
                                }
                                if node_a.blocked {
                                    return None;
                                }

                                let block_b_id = x * cells_y + n.iy;
                                let node_b = &nodes[block_b_id];
                                if let Some(c) = node_b.connection {
                                    if c != c_id {
                                        return None;
                                    }
                                }
                                if node_b.blocked {
                                    return None;
                                }
                            }
                            Some(((cell_id, Some(current)), c))
                        }
                        _ => None,
                    }
                })
                .collect()
        };

        // Set successor function depending on input layout
        let successors: &dyn Fn(&AStarNode<(usize, Option<usize>)>) -> Vec<((usize, Option<usize>), f64)> = match input.layout {
            Layout::Rectilinear => &rectilinear,
            Layout::Octilinear => &octilinear,
            Layout::Mixed => &mixed,
        };

        let is_target = |n: &(usize, Option<usize>)| -> bool { n.0 == target_node_id };

        // Set euclidean distance as heuristic
        let heuristic = |i: &(usize, Option<usize>)| -> f64 {
            let n = &nodes[i.0];
            let dx = n.ix.abs_diff(target_node.ix);
            let dy = n.iy.abs_diff(target_node.iy);
            f64::hypot(dx as f64, dy as f64)
        };

        let result = a_star(
            Vec::from([(start_node_id, None)]),
            &heuristic,
            &successors,
            &is_target,
            None,
        );

        // Block the cells of the resulting path so that no subsequent routings can interfere with it.
        match result {
            Some(path) => {
                succesful_routings += 1;
                let channel = path
                    .into_iter()
                    .map(|n| {
                        let node = &mut nodes[n.0];
                        node.blocked = true;
                        [node.x, node.y]
                    })
                    .collect::<Channel>();
                match &routing_connection {
                    RoutingConnection::PortToPort(port_to_port) => {
                        output_connections.push((port_to_port.connection, Vec::from([channel])));
                    }
                    RoutingConnection::StarBranch(star_branch) => {
                        let output_connection_option = output_connections
                            .iter_mut()
                            .find(|o| o.0 == star_branch.connection);
                        if let Some(output_connection) = output_connection_option {
                            output_connection.1.push(channel);
                        } else {
                            output_connections.push((star_branch.connection, Vec::from([channel])));
                        }
                    }
                }
            }
            _ => (),
        }
    }

    let output = BoardRouterOutputBoard {
        connections: output_connections,
    };

    if succesful_routings == 0 {
        Err(BoardRouterOutputError::NoConnectionsFound)
    } else if succesful_routings == n_routing_connections {
        Ok(output)
    } else {
        Err(BoardRouterOutputError::PartialResult(output))
    }
}
