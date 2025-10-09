use serde::{Deserialize, Serialize};
use web_sys::js_sys::Math::abs;
use crate::board_router::{
    compute_ports, ComputePortsInput, ComputePortsOutput, ConnectionID, Layout, Port,
    RouteInputConnections,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidateInput {
    pub board_width: Option<f64>,
    pub board_height: Option<f64>,
    pub port_diameter: Option<f64>,
    pub frame_height: Option<f64>,
    pub frame_width: Option<f64>,
    pub pitch: Option<f64>,
    pub pitch_offset_x: Option<f64>,
    pub pitch_offset_y: Option<f64>,
    pub channel_width: Option<f64>,
    pub channel_spacing: Option<f64>,
    pub max_ports: Option<usize>,
    pub layout: Option<Layout>,
    pub connections: Option<RouteInputConnections>,
    pub board_frame_gap_top_mm: Option<f64>,
    pub board_frame_gap_right_mm: Option<f64>,
    pub board_frame_gap_bottom_mm: Option<f64>,
    pub board_frame_gap_left_mm: Option<f64>
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationOk {
    warnings: Vec<ValidationWarning>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationErr {
    warnings: Vec<ValidationWarning>,
    errors: Vec<ValidationError>,
}

type MaxPorts = usize;
type ActualPorts = usize;

#[derive(Debug, Serialize, Deserialize)]
pub enum ValidationError {
    BoardWidthError(BoardWidthError),
    BoardHeightError(BoardHeightError),
    FrameHeightError(FrameHeightError),
    FrameWidthError(FrameWidthError),
    PortDiameterError(PortDiameterError),
    PitchError(PitchError),
    PitchOffsetXError(PitchOffsetXError),
    PitchOffsetYError(PitchOffsetYError),
    ChannelWidthError(ChannelWidthError),
    ChannelSpacingError(ChannelSpacingError),
    ChannelDimensionsTooLarge,
    MaxPortsExceeded(ActualPorts, MaxPorts),
    InvalidConnectionPortX(ConnectionID, Port),
    InvalidConnectionPortY(ConnectionID, Port),
}

#[derive(Debug, Serialize, Deserialize)]
pub enum BoardWidthError {
    Undefined,
    NotPositive,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum BoardHeightError {
    Undefined,
    NotPositive,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum FrameWidthError {
    Undefined,
    NotPositive,
    NotLargerThanBoardWidth,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum FrameHeightError {
    Undefined,
    NotPositive,
    NotLargerThanBoardHeight,
}
#[derive(Debug, Serialize, Deserialize)]
pub enum PortDiameterError {
    Undefined,
    NotPositive,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum PitchError {
    Undefined,
    NotPositive,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum PitchOffsetXError {
    Undefined,
    NotPositive,
    SmallerThanPitch,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum PitchOffsetYError {
    Undefined,
    NotPositive,
    SmallerThanPitch,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ChannelWidthError {
    Undefined,
    NotPositive,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ChannelSpacingError {
    Undefined,
    NotPositive,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ValidationWarning {
    PitchNotMultiple(f64),
    BoardWidthNotMultiple(f64),
    BoardHeightNotMultiple(f64),
}

#[derive(Debug, Serialize, Deserialize)]
pub enum OutsidePortDestinationError {
    Undefined,
    NotPositive,
}

macro_rules! some {
    ($input: ident, $($field: ident),*, $code: block) => {
        match ($($input.$field,)*) {
            ($(Some($field)),*,) => {
                $code
            },
            _ => ()
        }
    };
}

pub fn validate(input: ValidateInput) -> Result<ValidationOk, ValidationErr> {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    if let Some(board_width) = input.board_width {
        if board_width <= 0. {
            errors.push(ValidationError::BoardWidthError(
                BoardWidthError::NotPositive,
            ));
        } else if !is_integer(board_width / 1.5) {
            warnings.push(ValidationWarning::BoardWidthNotMultiple(
                1.5 * (board_width / 1.5).round(),
            ));
        }
    } else {
        errors.push(ValidationError::BoardWidthError(BoardWidthError::Undefined));
    }

    if let Some(board_height) = input.board_height {
        if board_height <= 0. {
            errors.push(ValidationError::BoardHeightError(
                BoardHeightError::NotPositive,
            ));
        } else if !is_integer(board_height / 1.5) {
            warnings.push(ValidationWarning::BoardHeightNotMultiple(
                1.5 * (board_height / 1.5).round(),
            ));
        }
    } else {
        errors.push(ValidationError::BoardHeightError(
            BoardHeightError::Undefined,
        ));
    }

    if let Some(frame_width) = input.frame_width {
        if frame_width <= 0. {
            errors.push(ValidationError::FrameWidthError(
                FrameWidthError::NotPositive,
            ));
        }
    } else {
        errors.push(ValidationError::FrameWidthError(FrameWidthError::Undefined));
    }

    if let Some(frame_height) = input.frame_height {
        if frame_height <= 0. {
            errors.push(ValidationError::FrameHeightError(
                FrameHeightError::NotPositive,
            ));
        }
    } else {
        errors.push(ValidationError::FrameHeightError(FrameHeightError::Undefined));
    }

    if let Some(port_diameter) = input.port_diameter {
        if port_diameter <= 0. {
            errors.push(ValidationError::PortDiameterError(
                PortDiameterError::NotPositive,
            ));
        }
    } else {
        errors.push(ValidationError::PortDiameterError(
            PortDiameterError::Undefined,
        ));
    }

    if let Some(pitch) = input.pitch {
        if pitch <= 0. {
            errors.push(ValidationError::PitchError(PitchError::NotPositive));
        } else if !is_integer(pitch / 1.5) {
            warnings.push(ValidationWarning::PitchNotMultiple(
                1.5 * (pitch / 1.5).round(),
            ));
        }
    } else {
        errors.push(ValidationError::PitchError(PitchError::Undefined));
    }

    if let Some(pitch_offset_x) = input.pitch_offset_x {
        if pitch_offset_x <= 0. {
            errors.push(ValidationError::PitchOffsetXError(
                PitchOffsetXError::NotPositive,
            ));
        }
    } else {
        errors.push(ValidationError::PitchOffsetXError(
            PitchOffsetXError::Undefined,
        ));
    }

    if let Some(pitch_offset_y) = input.pitch_offset_y {
        if pitch_offset_y <= 0. {
            errors.push(ValidationError::PitchOffsetYError(
                PitchOffsetYError::NotPositive,
            ));
        }
    } else {
        errors.push(ValidationError::PitchOffsetYError(
            PitchOffsetYError::Undefined,
        ));
    }

    if let Some(channel_width) = input.channel_width {
        if channel_width <= 0. {
            errors.push(ValidationError::ChannelWidthError(
                ChannelWidthError::NotPositive,
            ));
        }
    } else {
        errors.push(ValidationError::ChannelWidthError(
            ChannelWidthError::Undefined,
        ));
    }

    if let Some(channel_spacing) = input.channel_spacing {
        if channel_spacing <= 0. {
            errors.push(ValidationError::ChannelSpacingError(
                ChannelSpacingError::NotPositive,
            ));
        }
    } else {
        errors.push(ValidationError::ChannelSpacingError(
            ChannelSpacingError::Undefined,
        ));
    }

    some!(input, frame_height, board_height, {
        if frame_height <= board_height {
            errors.push(ValidationError::FrameHeightError(
                FrameHeightError::NotLargerThanBoardHeight,
            ));
        }
    });

    some!(input, frame_width, board_width, {
        if frame_width <= board_width {
            errors.push(ValidationError::FrameWidthError(
                FrameWidthError::NotLargerThanBoardWidth,
            ));
        }
    });

    some!(input, pitch, pitch_offset_x, {
        if pitch_offset_x < pitch {
            errors.push(ValidationError::PitchOffsetXError(
                PitchOffsetXError::SmallerThanPitch,
            ))
        }
    });

    some!(input, pitch, pitch_offset_y, {
        if pitch_offset_y < pitch {
            errors.push(ValidationError::PitchOffsetYError(
                PitchOffsetYError::SmallerThanPitch,
            ))
        }
    });

    if input.board_width.is_some()
        && input.board_height.is_some()
        && input.pitch.is_some()
        && input.pitch_offset_x.is_some()
        && input.pitch_offset_y.is_some()
        && input.max_ports.is_some()
    {
        let ComputePortsOutput { ports_x, ports_y } = compute_ports(ComputePortsInput {
            board_width: input.board_width.unwrap(),
            board_height: input.board_height.unwrap(),
            pitch: input.pitch.unwrap(),
            pitch_offset_x: input.pitch_offset_x.unwrap(),
            pitch_offset_y: input.pitch_offset_y.unwrap(),
        });
        let total_ports = ports_x * ports_y;
        if total_ports > input.max_ports.unwrap() {
            errors.push(ValidationError::MaxPortsExceeded(
                total_ports,
                input.max_ports.unwrap(),
            ))
        }
    }

    if errors.len() > 0 {
        Err(ValidationErr { warnings, errors })
    } else {
        Ok(ValidationOk { warnings })
    }
}

fn is_integer(value: f64) -> bool {
    value == (value as u64) as f64
}
