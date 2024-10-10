use core::f64;
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;

use crate::graph_search::{a_star, AStarNode};

type Coordinate = i64;
type Length = u64;

#[derive(Debug, Serialize, Deserialize)]
pub struct RouteInput {
    pub channel_width: Length,
    pub channel_spacing: Length,
    pub layout: Layout,
    pub board_width: Length,
    pub board_height: Length,
    pub pitch: Length,
    pub pitch_offset_x: Length,
    pub pitch_offset_y: Length,
    pub min_grid_size: Length,
    pub port_diameter: Length,
    pub max_ports: usize,
    pub connections: RouteInputConnections,
}

type RouteInputConnections = Vec<RouteInputConnection>;
type RouteInputConnection = (ConnectionID, Vec<Port>); // Handle multiple ports for one connection
type Port = (usize, usize);

#[derive(Debug, Serialize, Deserialize)]
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

pub type BoardRouterOutputConnection = (usize, Channel);  // tuple of connection ID (unsigned integer) and channel, the channel consists of a vector of points

pub type Channel = Vec<Point>;

pub type Point = [Coordinate; 2]; // a point in 2D (x, y)

#[derive(Eq, Debug)]
struct GridNode {
    id: usize,
    ix: usize,
    iy: usize,
    x: Coordinate,
    y: Coordinate,
    connection: Option<usize>,
    blocked: bool, // can have only one connection
    multiConnection: bool, // can have multiple connections
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

#[inline]
fn compute_extra_node(nodes: &[GridNode], ports: &[Port], cells_x: usize, cells_y: usize) -> GridNode {
    // // Filter out any invalid ports (ones that are out of bounds), should not be possible based on the input
    let valid_ports: Vec<_> = ports
        .iter()
        .filter(|p| p.0 < cells_x && p.1 < cells_y)
        .collect();

    if valid_ports.is_empty() {
        panic!("No valid ports to compute the center node.");
    }

    // Find the minimum and maximum x and y coordinates
    let min_x = valid_ports
        .iter()
        .map(|p| nodes[p.0 * cells_y + p.1].x)
        .min()
        .expect("Unable to find min x coordinate");

    let max_x = valid_ports
        .iter()
        .map(|p| nodes[p.0 * cells_y + p.1].x)
        .max()
        .expect("Unable to find max x coordinate");

    let min_y = valid_ports
        .iter()
        .map(|p| nodes[p.0 * cells_y + p.1].y)
        .min()
        .expect("Unable to find min y coordinate");

    let max_y = valid_ports
        .iter()
        .map(|p| nodes[p.0 * cells_y + p.1].y)
        .max()
        .expect("Unable to find max y coordinate");

    // Calculate the midpoints of x and y
    let center_x = (min_x + max_x) / 2;
    let center_y = (min_y + max_y) / 2;

    // Debug output
    println!("Ports: {:?}", ports);
    println!("Min X: {}, Max X: {}", min_x, max_x);
    println!("Min Y: {}, Max Y: {}", min_y, max_y);
    println!("Center X: {}, Center Y: {}", center_x, center_y);

    // Create a new GridNode at the computed center
    GridNode {
        id: usize::MAX, // Temporary ID, can be updated later
        ix: usize::MAX, // Grid indices can be set later
        iy: usize::MAX, // Grid indices can be set later
        x: center_x,
        y: center_y,
        connection: None,
        blocked: false,
        multiConnection: true, // Allows multiple connections for this center node
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComputePortsInput {
    board_width: Length,
    board_height: Length,
    pitch: Length,
    pitch_offset_x: Length,
    pitch_offset_y: Length,
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
    let ports_x = usize::try_from((board_width - 2 * pitch_offset_x) / pitch + 1).unwrap();
    let ports_y = usize::try_from((board_height - 2 * pitch_offset_y) / pitch + 1).unwrap();
    return ComputePortsOutput { ports_x, ports_y };
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidateInputRaw {
    pub channel_width: Option<f64>,
    pub channel_spacing: Option<f64>,
    pub board_width: Option<f64>,
    pub board_height: Option<f64>,
    pub pitch: Option<f64>,
    pub pitch_offset_x: Option<f64>,
    pub pitch_offset_y: Option<f64>,
    pub min_grid_size: Option<f64>,
    pub max_ports: Option<f64>,
    pub layout: Option<Layout>,
    pub connections: Option<RouteInputConnections>,
}

pub struct ValidateInput {
    pub channel_width: Option<Length>,
    pub channel_spacing: Option<Length>,
    pub board_width: Option<Length>,
    pub board_height: Option<Length>,
    pub pitch: Option<Length>,
    pub pitch_offset_x: Option<Length>,
    pub pitch_offset_y: Option<Length>,
    pub min_grid_size: Option<Length>,
    pub max_ports: Option<usize>,
    pub layout: Option<Layout>,
    pub connections: Option<RouteInputConnections>,
}

#[derive(Debug, Serialize, Deserialize)]
enum ValidateOutput {
    Ok(),
    Err(Vec<ValidationError>),
}

type ConnectionID = usize;

#[derive(Debug, Serialize, Deserialize)]
pub enum ValidationError {
    MissingChannelWidth,
    MissingChannelSpacing,
    MissingBoardWidth,
    MissingBoardHeight,
    MissingPitch,
    MissingPitchOffsetX,
    MissingPitchOffsetY,
    MissingMinGridSize,
    MissingConnections,
    InvalidChannelWidth,
    InvalidChannelSpacing,
    InvalidBoardWidth,
    InvalidBoardHeight,
    InvalidPitch,
    InvalidPitchOffsetX,
    InvalidPitchOffsetY,
    InvalidMinGridSize,
    InvalidMaxPorts,
    ChannelWidthNotPositive,
    ChannelSpacingNotPositive,
    BoardWidthNotPositive,
    BoardHeightNotPositive,
    PitchNotPositive,
    PitchOffsetXNotPositive,
    PitchOffsetYNotPositive,
    PitchOffsetXTooSmall,
    PitchOffsetYTooSmall,
    ChannelDimensionsTooLarge,
    MaxPortsExceeded(usize, usize),
    InvalidConnectionPortX(ConnectionID, Port),
    InvalidConnectionPortY(ConnectionID, Port),
}

macro_rules! check_missing {
    ( $field:ident, $error:ident, $input: ident, $errors: ident ) => {{
        match $input.$field {
            None => $errors.push(ValidationError::$error),
            _ => (),
        }
    }};
}

macro_rules! not_missing {
    ($input: ident, $code: block, $($field: ident),*) => {
        match ($($input.$field,)*) {
            ($(Some($field)),*,) => {
                $code
            },
            _ => ()
        }
    };
}

macro_rules! check_valid_length {
    ($field: ident, $error: ident, $input: ident, $errors: ident) => {
        match $input.$field {
            Some(f) => {
                if f != (f as Length) as f64 {
                    $errors.push(ValidationError::$error);
                    None
                } else {
                    Some(f as Length)
                }
            }
            None => None,
        }
    };
}

macro_rules! check_valid_usize {
    ($field: ident, $error: ident, $input: ident, $errors: ident) => {
        match $input.$field {
            Some(f) => {
                if f != (f as u64) as f64 {
                    $errors.push(ValidationError::$error);
                    None
                } else {
                    Some(f as usize)
                }
            }
            None => None,
        }
    };
}

macro_rules! check_positive {
    ($field: ident, $error: ident, $input: ident, $errors: ident) => {
        not_missing!(
            $input,
            {
                if $field <= 0 {
                    $errors.push(ValidationError::$error);
                }
            },
            $field
        )
    };
}

pub fn validate(validate_input: ValidateInputRaw) -> Result<(), Vec<ValidationError>> {
    let mut errors = Vec::new();

    check_missing!(channel_width, MissingChannelWidth, validate_input, errors);
    check_missing!(
        channel_spacing,
        MissingChannelSpacing,
        validate_input,
        errors
    );
    check_missing!(board_width, MissingBoardWidth, validate_input, errors);
    check_missing!(board_height, MissingBoardHeight, validate_input, errors);
    check_missing!(pitch, MissingPitch, validate_input, errors);
    check_missing!(pitch_offset_x, MissingPitchOffsetX, validate_input, errors);
    check_missing!(pitch_offset_y, MissingPitchOffsetY, validate_input, errors);
    check_missing!(connections, MissingConnections, validate_input, errors);

    let input = ValidateInput {
        channel_width: check_valid_length!(
            channel_width,
            InvalidChannelWidth,
            validate_input,
            errors
        ),
        channel_spacing: check_valid_length!(
            channel_spacing,
            InvalidChannelSpacing,
            validate_input,
            errors
        ),
        board_width: check_valid_length!(board_width, InvalidBoardWidth, validate_input, errors),
        board_height: check_valid_length!(board_height, InvalidBoardHeight, validate_input, errors),
        pitch: check_valid_length!(pitch, InvalidPitch, validate_input, errors),
        pitch_offset_x: check_valid_length!(
            pitch_offset_x,
            InvalidPitchOffsetX,
            validate_input,
            errors
        ),
        pitch_offset_y: check_valid_length!(
            pitch_offset_y,
            InvalidPitchOffsetY,
            validate_input,
            errors
        ),
        min_grid_size: check_valid_length!(
            min_grid_size,
            InvalidMinGridSize,
            validate_input,
            errors
        ),
        max_ports: check_valid_usize!(max_ports, InvalidMaxPorts, validate_input, errors),
        layout: validate_input.layout,
        connections: validate_input.connections,
    };

    check_positive!(channel_width, ChannelWidthNotPositive, input, errors);
    check_positive!(channel_spacing, ChannelSpacingNotPositive, input, errors);
    check_positive!(board_width, BoardWidthNotPositive, input, errors);
    check_positive!(board_height, BoardHeightNotPositive, input, errors);
    check_positive!(pitch, PitchNotPositive, input, errors);
    check_positive!(pitch_offset_x, PitchOffsetXNotPositive, input, errors);
    check_positive!(pitch_offset_y, PitchOffsetYNotPositive, input, errors);

    not_missing!(
        input,
        {
            if pitch_offset_x < pitch {
                errors.push(ValidationError::PitchOffsetXTooSmall);
            }
        },
        pitch_offset_x,
        pitch
    );

    not_missing!(
        input,
        {
            if pitch_offset_y < pitch {
                errors.push(ValidationError::PitchOffsetYTooSmall);
            }
        },
        pitch_offset_y,
        pitch
    );

    not_missing!(
        input,
        {
            let channel_distance = channel_width + channel_spacing;
            if channel_distance > pitch {
                errors.push(ValidationError::ChannelDimensionsTooLarge);
            }
        },
        channel_width,
        channel_spacing,
        pitch
    );

    not_missing!(
        input,
        {
            if board_width > 0
                && board_height > 0
                && pitch > 0
                && pitch_offset_x > 0
                && pitch_offset_y > 0
            {
                let ComputePortsOutput { ports_x, ports_y } = compute_ports(ComputePortsInput {
                    board_width,
                    board_height,
                    pitch,
                    pitch_offset_x,
                    pitch_offset_y,
                });

                for (c_id, ports) in connections.iter() {
                    for (x, y) in ports.iter() {
                        if *x >= ports_x {
                            errors.push(ValidationError::InvalidConnectionPortX(*c_id, (*x, *y)));
                        }
                        if *y >= ports_y {
                            errors.push(ValidationError::InvalidConnectionPortY(*c_id, (*x, *y)));
                        }
                    }
                }
            }
        },
        board_width,
        board_height,
        pitch,
        pitch_offset_x,
        pitch_offset_y,
        connections
    );

    not_missing!(
        input,
        {
            if board_width > 0
                && board_height > 0
                && pitch > 0
                && pitch_offset_x > 0
                && pitch_offset_y > 0
            {
                let ComputePortsOutput { ports_x, ports_y } = compute_ports(ComputePortsInput {
                    board_width,
                    board_height,
                    pitch,
                    pitch_offset_x,
                    pitch_offset_y,
                });

                let ports = ports_x * ports_y;
                if ports > max_ports {
                    errors.push(ValidationError::MaxPortsExceeded(ports, max_ports));
                }
            }
        },
        board_width,
        board_height,
        pitch,
        pitch_offset_x,
        pitch_offset_y,
        max_ports
    );

    if errors.len() > 0 {
        Err(errors)
    } else {
        Ok(())
    }
}

pub fn route(input: RouteInput) -> BoardRouterOutput { // this is the main function I want to adapt
    let channel_distance = input.channel_width + input.channel_spacing;
    let cells_per_pitch = input.pitch / channel_distance;
    let cell_size = input.pitch / cells_per_pitch;
    let half_cell_size = cell_size / 2;
    let ComputePortsOutput { ports_x, ports_y } = compute_ports(ComputePortsInput {
        board_width: input.board_width,
        board_height: input.board_height,
        pitch: input.pitch,
        pitch_offset_x: input.pitch_offset_x,
        pitch_offset_y: input.pitch_offset_y,
    });
    let cells_x =
        usize::try_from(ports_x as u64 * cells_per_pitch - (1 - cells_per_pitch % 2)).unwrap();
    let cells_y =
        usize::try_from(ports_y as u64 * cells_per_pitch - (1 - cells_per_pitch % 2)).unwrap();
    let cell_offset_x =
        input.pitch_offset_x - ((cells_per_pitch - 1) / 2) * cell_size - half_cell_size;
    let cell_offset_y =
        input.pitch_offset_y - ((cells_per_pitch - 1) / 2) * cell_size - half_cell_size;

    let port_radius = input.port_diameter / 2;
    let port_influence_radius =
        port_radius + input.channel_spacing + input.channel_width.div_ceil(2);
    let box_size = (port_influence_radius - 1) / cell_size;

    let mut nodes = Vec::<GridNode>::new();

    // Generate routing nodes/cells
    for x in 0..cells_x {
        for y in 0..cells_y {
            nodes.push(GridNode {
                id: (x * cells_y + y) as usize,
                ix: x,
                iy: y,
                x: i64::try_from(
                    cell_offset_x + half_cell_size + u64::try_from(x).unwrap() * cell_size,
                )
                .unwrap(),
                y: i64::try_from(
                    cell_offset_y + half_cell_size + u64::try_from(y).unwrap() * cell_size,
                )
                .unwrap(),
                connection: None,
                blocked: false,
                multiConnection: false,
            });
        }
    }

    let mut input_connections = input
        .connections
        .to_vec()
        .into_iter()
        .collect::<Vec<RouteInputConnection>>();

    let n_input_connections = input_connections.len();

    // here are the extra connections to the center node for start like connections are stored
    let mut extra_connections = Vec::new(); 
    let mut next_connection_id = n_input_connections; 

    // Reserve cells at and around used ports for the corresponding connection only (prevent other connections from crossing foreign ports)
    for (c_id, ports) in input_connections.iter() {
        if ports.len() > 2 { // there are more than 2 nodes connected, so we connect them in a star like structure
            // define the center node
            let mut center_node = compute_extra_node(&nodes, &ports, cells_x, cells_y);

            let center_ix = center_node.ix;
            let center_iy = center_node.iy;

            // Assign an ID to the center node (it might need to be added to nodes array)
            center_node.id = nodes.len();
            nodes.push(center_node);
            // create a connection from each port to the center node
            for port in ports.iter() {
                let new_connection = (
                    next_connection_id,
                    vec![*port, (center_ix, center_iy)]
                );

                extra_connections.push(new_connection);
                next_connection_id += 1;
            } 
        }
    }
    input_connections.extend(extra_connections);

    for (c_id, ports) in input_connections.iter() {
        // Extract the two ports to connect
        let (ax, ay) = ports[0];
        let (bx, by) = ports[1];

        let cpp = usize::try_from(cells_per_pitch).unwrap();
        dbg!(cpp, ax, ay, bx, by);

        let (a_cell_x, a_cell_y, b_cell_x, b_cell_y);

        if !nodes[ax * cells_y + ay].multiConnection {
            // If the node does not support multiple connections, use the recalculated positions
            a_cell_x = ((cpp - 1) / 2) + cpp * ax;
            a_cell_y = ((cpp - 1) / 2) + cpp * ay;
            b_cell_x = ((cpp - 1) / 2) + cpp * bx;
            b_cell_y = ((cpp - 1) / 2) + cpp * by;
        } else {
            // If the node supports multiple connections (center node), directly use its computed position
            a_cell_x = ax;
            a_cell_y = ay;
            b_cell_x = bx;
            b_cell_y = by;
        }
        
        let a_node_position = (
            nodes[a_cell_x * cells_y + a_cell_y].x,
            nodes[a_cell_x * cells_y + a_cell_y].y,
        );
        let b_node_position = (
            nodes[b_cell_x * cells_y + b_cell_y].x,
            nodes[b_cell_x * cells_y + b_cell_y].y,
        );


        for box_x in usize::saturating_sub(a_cell_x, box_size as usize)
            ..(a_cell_x + 1 + box_size as usize).clamp(0, cells_x)
        {
            for box_y in usize::saturating_sub(a_cell_y, box_size as usize)
                ..(a_cell_y + 1 + box_size as usize).clamp(0, cells_y)
            {
                let node_position = (
                    nodes[box_x * cells_y + box_y].x,
                    nodes[box_x * cells_y + box_y].y,
                );
                let distance = f64::hypot(
                    node_position.0 as f64 - a_node_position.0 as f64,
                    node_position.1 as f64 - a_node_position.1 as f64,
                );
                if distance < port_influence_radius as f64 && nodes[box_x * cells_y + box_y].multiConnection == false {
                    // If the cell is already reserved for another connection (e.g., ports close to each other), no connection can be routed through this cell
                    if nodes[box_x * cells_y + box_y].connection.is_none() {
                        nodes[box_x * cells_y + box_y].connection = Some(*c_id);
                    } else {
                        nodes[box_x * cells_y + box_y].blocked = true;
                    }
                }
            }
        }

        for box_x in usize::saturating_sub(b_cell_x, box_size as usize)
            ..(b_cell_x + 1 + box_size as usize).clamp(0, cells_x)
        {
            for box_y in usize::saturating_sub(b_cell_y, box_size as usize)
                ..(b_cell_y + 1 + box_size as usize).clamp(0, cells_y)
            {
                let node_position = (
                    nodes[box_x * cells_y + box_y].x,
                    nodes[box_x * cells_y + box_y].y,
                );
                let distance = f64::hypot(
                    node_position.0 as f64 - b_node_position.0 as f64,
                    node_position.1 as f64 - b_node_position.1 as f64,
                );
                if distance < port_influence_radius as f64 && nodes[box_x * cells_y + box_y].multiConnection == false {
                    // If the cell is already reserved for another connection (e.g., ports close to each other), no connection can be routed through this cell
                    if nodes[box_x * cells_y + box_y].connection.is_none() {
                        nodes[box_x * cells_y + box_y].connection = Some(*c_id);
                    } else {
                        nodes[box_x * cells_y + box_y].blocked = true;
                    }
                }
            }
        }
    }
    

    // Sort connections by direct distance, ascending
    fn cmp_connections((_, a): &RouteInputConnection, (_, b): &RouteInputConnection) -> Ordering {
        let adx = usize::abs_diff(a[0].0, a[1].0);
        let ady = usize::abs_diff(a[0].1, a[1].1);
        let bdx = usize::abs_diff(b[0].0, b[1].0);
        let bdy = usize::abs_diff(b[0].1, b[1].1);

        let al = adx + ady;
        let bl = bdx + bdy;
        usize::cmp(&al, &bl)
    }

    input_connections.sort_by(&cmp_connections);
    let mut output_connections = Vec::<BoardRouterOutputConnection>::new();

    if input_connections.len() == 0 {
        return Err(BoardRouterOutputError::NoInputConnections);
    }

    // Route connections sequentially
    for (c_id, ports) in input_connections {
        let (ax, ay) = ports[0];
        let (bx, by) = ports[1];

        let cpp = usize::try_from(cells_per_pitch).unwrap();

        let (a_cell_x, a_cell_y, b_cell_x, b_cell_y);

        if !nodes[ax * cells_y + ay].multiConnection {
            // If the node does not support multiple connections, use the recalculated positions
            a_cell_x = ((cpp - 1) / 2) + cpp * ax;
            a_cell_y = ((cpp - 1) / 2) + cpp * ay;
            b_cell_x = ((cpp - 1) / 2) + cpp * bx;
            b_cell_y = ((cpp - 1) / 2) + cpp * by;
        } else {
            // If the node supports multiple connections (center node), directly use its computed position
            a_cell_x = ax;
            a_cell_y = ay;
            b_cell_x = bx;
            b_cell_y = by;
        }
        let start_node_id = a_cell_x * cells_y + a_cell_y;
        let target_node_id = b_cell_x * cells_y + b_cell_y;
        let target_node = &nodes[target_node_id];

        // Setup successor cell functions for rectilinear, octilinear, etc; Since they capture some variables (e.g., cells_x/y), they need to be defined here.
        let rectilinear = |a: &AStarNode<usize>| -> Vec<(usize, f64)> {
            let n = &nodes[a.node];
            let options = match a.previous {
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
                .filter_map(|o| -> Option<(usize, f64)> {
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
                            Some((cell_id, c))
                        }
                        _ => None,
                    }
                })
                .collect()
        };

        let octilinear = |a: &AStarNode<usize>| -> Vec<(usize, f64)> {
            let n = &nodes[a.node];
            let options = match a.previous {
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
                .filter_map(|o| -> Option<(usize, f64)> {
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
                            Some((cell_id, c))
                        }
                        _ => None,
                    }
                })
                .collect()
        };

        let mixed = |a: &AStarNode<usize>| -> Vec<(usize, f64)> {
            let n = &nodes[a.node];
            let options = match a.previous {
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
                .filter_map(|o| -> Option<(usize, f64)> {
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
                            Some((cell_id, c))
                        }
                        _ => None,
                    }
                })
                .collect()
        };

        // Set successor function depending on input layout
        let successors: &dyn Fn(&AStarNode<usize>) -> Vec<(usize, f64)> = match input.layout {
            Layout::Rectilinear => &rectilinear,
            Layout::Octilinear => &octilinear,
            Layout::Mixed => &mixed,
        };

        let is_target = |n: &usize| -> bool { *n == target_node_id };

        // Set euclidean distance as heuristic
        let heuristic = |i: &usize| -> f64 {
            let n = &nodes[*i];
            let dx = n.ix as isize - target_node.ix as isize;
            let dy = n.iy as isize - target_node.iy as isize;
            f64::hypot(dx as f64, dy as f64)
        };

        let result = a_star(
            Vec::from([start_node_id]),
            &heuristic,
            &successors,
            &is_target,
            None,
        );

        // Block the cells of the resulting path so that no subsequent routings can interfere with it.
        match result {
            Some(path) => output_connections.push((
                c_id,
                path.into_iter()
                    .map(|n| {
                        let node = &mut nodes[n];
                        node.blocked = true;
                        [node.x, node.y]
                    })
                    .collect::<Channel>(),
            )),
            _ => (),
        }
    }

    let n_output_connections = output_connections.len();
    let output = BoardRouterOutputBoard {
        connections: output_connections,
    };

    if n_output_connections == 0 {
        Err(BoardRouterOutputError::NoConnectionsFound)
    } else if n_output_connections == n_input_connections {
        Ok(output)
    } else {
        Err(BoardRouterOutputError::PartialResult(output))
    }
}

/* Dependency does not compile to Webassembly
#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateDXFInput {
    pub channel_width: Length,
    pub connections: Vec<BoardRouterOutputConnection>
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateDXFOutput(String);

pub fn generate_dxf(input: GenerateDXFInput) -> GenerateDXFOutput {
    let drawing = &mut Drawing::new();

    for (_, points) in input.connections {
        let mut polyline = Polyline::default();
        for point in points {
            polyline.add_vertex(drawing, Vertex::new(dxf::Point {
                x: point[0] as f64,
                y: point[1] as f64,
                z: 0.
            }));
        }

        drawing.add_entity(Entity::new(EntityType::Polyline(polyline)));
    }

    let mut writer = BufWriter::new(Vec::new());
    drawing.save(&mut writer);
    let bytes = writer.into_inner().unwrap();
    let result = String::from_utf8(bytes).unwrap();

    GenerateDXFOutput(result)
} */
