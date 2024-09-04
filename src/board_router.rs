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
    pub max_ports: usize,
    pub connections: RouteInputConnections,
}

type RouteInputConnections = Vec<RouteInputConnection>;
type RouteInputConnection = (ConnectionID, (Port, Port));
type Port = (usize, usize);

#[derive(Debug, Serialize, Deserialize)]
pub struct BoardRouterInputChannel {
    pub width: Length,
    pub spacing: Length,
}

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
    pub connections: Vec<BoardRouterOutputConnection>,
}

pub type BoardRouterOutputConnection = (usize, Channel);

pub type Channel = Vec<Point>;

pub type Point = [Coordinate; 2];

#[derive(Eq, Debug)]
struct GridNode {
    id: usize,
    ix: usize,
    iy: usize,
    x: Coordinate,
    y: Coordinate,
    connection: Option<usize>,
    blocked: bool,
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

                for (c_id, ((ax, ay), (bx, by))) in connections.iter() {
                    if *ax >= ports_x {
                        errors.push(ValidationError::InvalidConnectionPortX(*c_id, (*ax, *ay)));
                    }
                    if *ay >= ports_y {
                        errors.push(ValidationError::InvalidConnectionPortY(*c_id, (*ax, *ay)));
                    }

                    if *bx >= ports_x {
                        errors.push(ValidationError::InvalidConnectionPortX(*c_id, (*bx, *by)));
                    }
                    if *by >= ports_y {
                        errors.push(ValidationError::InvalidConnectionPortY(*c_id, (*bx, *by)));
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

pub fn route(input: RouteInput) -> BoardRouterOutput {
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

    let mut nodes = Vec::<GridNode>::new();

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
            });
        }
    }

    let mut input_connections = input
        .connections
        .to_vec()
        .into_iter()
        .collect::<Vec<RouteInputConnection>>();

    let n_input_connections = input_connections.len();

    for (c_id, ((ax, ay), (bx, by))) in input_connections.iter() {
        let cpp = usize::try_from(cells_per_pitch).unwrap();
        let a_cell_x = ((cpp - 1) / 2) + cpp * ax;
        let a_cell_y = ((cpp - 1) / 2) + cpp * ay;
        let b_cell_x = ((cpp - 1) / 2) + cpp * bx;
        let b_cell_y = ((cpp - 1) / 2) + cpp * by;
        nodes[a_cell_x * cells_y + a_cell_y].connection = Some(*c_id);
        nodes[b_cell_x * cells_y + b_cell_y].connection = Some(*c_id);
    }

    fn cmp_connections(
        (_, a): &RouteInputConnection,
        (_, b): &RouteInputConnection,
    ) -> Ordering {
        let adx = usize::abs_diff(a.0 .0, a.1 .0);
        let ady = usize::abs_diff(a.0 .1, a.1 .1);
        let bdx = usize::abs_diff(b.0 .0, b.1 .0);
        let bdy = usize::abs_diff(b.0 .1, b.1 .1);
        let al = adx + ady;
        let bl = bdx + bdy;
        usize::cmp(&al, &bl)
    }

    input_connections.sort_by(&cmp_connections);
    let mut output_connections = Vec::<BoardRouterOutputConnection>::new();

    if input_connections.len() == 0 {
        return Err(BoardRouterOutputError::NoInputConnections);
    }

    for (c_id, ((ax, ay), (bx, by))) in input_connections {
        let cpp = usize::try_from(cells_per_pitch).unwrap();
        let a_cell_x = ((cpp - 1) / 2) + cpp * ax;
        let a_cell_y = ((cpp - 1) / 2) + cpp * ay;
        let b_cell_x = ((cpp - 1) / 2) + cpp * bx;
        let b_cell_y = ((cpp - 1) / 2) + cpp * by;
        let start_node_id = a_cell_x * cells_y + a_cell_y;
        let target_node_id = b_cell_x * cells_y + b_cell_y;
        let target_node = &nodes[target_node_id];

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

        let successors: &dyn Fn(&AStarNode<usize>) -> Vec<(usize, f64)> = match input.layout {
            Layout::Rectilinear => &rectilinear,
            Layout::Octilinear => &octilinear,
            Layout::Mixed => &mixed,
        };

        let is_target = |n: &usize| -> bool { *n == target_node_id };

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
            None
        );

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
