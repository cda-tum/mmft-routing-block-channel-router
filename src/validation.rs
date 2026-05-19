use serde::{Deserialize, Serialize};

use crate::board_router::{
    compute_ports, ComputePortsInput, ComputePortsOutput, ConnectionID, Layout, Port,
    RouteInputConnections,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidateInput {
    pub board_width: Option<f64>,
    pub board_height: Option<f64>,
    pub board_thickness: Option<f64>,
    pub channel_height: Option<f64>,
    pub port_diameter: Option<f64>,
    pub pitch: Option<f64>,
    pub pitch_offset_x: Option<f64>,
    pub pitch_offset_y: Option<f64>,
    pub channel_width: Option<f64>,
    pub channel_spacing: Option<f64>,
    pub max_ports: Option<usize>,
    pub layout: Option<Layout>,
    pub connections: Option<RouteInputConnections>,
    pub exclusion_x: Option<f64>,
    pub exclusion_y: Option<f64>,
    pub exclusion_width: Option<f64>,
    pub exclusion_height: Option<f64>,
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
    PortDiameterError(PortDiameterError),
    BoardThicknessError(BoardThicknessError),
    PitchError(PitchError),
    PitchOffsetXError(PitchOffsetXError),
    PitchOffsetYError(PitchOffsetYError),
    ChannelWidthError(ChannelWidthError),
    ChannelSpacingError(ChannelSpacingError),
    ChannelHeightError(ChannelHeightError),
    ChannelDimensionsTooLarge,
    MaxPortsExceeded(ActualPorts, MaxPorts),
    InvalidConnectionPortX(ConnectionID, Port),
    InvalidConnectionPortY(ConnectionID, Port),
    ExclusionXError(ExclusionXError),
    ExclusionYError(ExclusionYError),
    ExclusionWidthError(ExclusionWidthError),
    ExclusionHeightError(ExclusionHeightError),
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
pub enum BoardThicknessError {
    Undefined,
    NotPositive,
    SmallerThanChannelHeight,
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
pub enum ChannelHeightError {
    Undefined,
    NotPositive,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ChannelSpacingError {
    Undefined,
    NotPositive,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ExclusionXError {
    Undefined,
    NotPositive,
    OutOfBounds,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ExclusionYError {
    Undefined,
    NotPositive,
    OutOfBounds,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ExclusionWidthError {
    Undefined,
    NotPositive,
    LargerThanBoard,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ExclusionHeightError {
    Undefined,
    NotPositive,
    LargerThanBoard,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ValidationWarning {
    PitchNotMultiple(f64),
    BoardWidthNotMultiple(f64),
    BoardHeightNotMultiple(f64),
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

    if let Some(board_thickness) = input.board_thickness {
        if board_thickness <= 0. {
            errors.push(ValidationError::BoardThicknessError(
                BoardThicknessError::NotPositive,
            ));
        } else if (input.channel_height.is_some() && board_thickness <= input.channel_height.unwrap()) {
            errors.push(ValidationError::BoardThicknessError(
                BoardThicknessError::SmallerThanChannelHeight,
            ));
        }
    } else {
        errors.push(ValidationError::BoardThicknessError(
            BoardThicknessError::Undefined,
        ));
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

    if let Some(channel_height) = input.channel_height {
        if channel_height <= 0. {
            errors.push(ValidationError::ChannelHeightError(
                ChannelHeightError::NotPositive,
            ));
        }
    } else {
        errors.push(ValidationError::ChannelHeightError(
            ChannelHeightError::Undefined,
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

    if let Some(exclusion_x) = input.exclusion_x {
        if exclusion_x <= 0. {
            errors.push(ValidationError::ExclusionXError(
                ExclusionXError::NotPositive,
            ));
        }
    } else {
        errors.push(ValidationError::ExclusionXError(
            ExclusionXError::Undefined,
        ));
    }

    if let Some(exclusion_y) = input.exclusion_y {
        if exclusion_y <= 0. {
            errors.push(ValidationError::ExclusionYError(
                ExclusionYError::NotPositive,
            ));
        }
    } else {
        errors.push(ValidationError::ExclusionYError(
            ExclusionYError::Undefined,
        ));
    }

    if let Some(exclusion_width) = input.exclusion_width {
        if exclusion_width <= 0. {
            errors.push(ValidationError::ExclusionWidthError(
                ExclusionWidthError::NotPositive,
            ));
        }
    } else {
        errors.push(ValidationError::ExclusionWidthError(
            ExclusionWidthError::Undefined,
        ));
    }

    if let Some(exclusion_height) = input.exclusion_height {
        if exclusion_height <= 0. {
            errors.push(ValidationError::ExclusionHeightError(
                ExclusionHeightError::NotPositive,
            ));
        }
    } else {
        errors.push(ValidationError::ExclusionHeightError(
            ExclusionHeightError::Undefined,
        ));
    }

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

    some!(input, board_width, exclusion_x, {
        if board_width < exclusion_x {
            errors.push(ValidationError::ExclusionXError(
                ExclusionXError::OutOfBounds,
            ))
        }
    });

    some!(input, board_height, exclusion_y, {
        if board_height < exclusion_y {
            errors.push(ValidationError::ExclusionXError(
                ExclusionXError::OutOfBounds,
            ))
        }
    });

    some!(input, board_width, exclusion_x, exclusion_width, {
        if board_width < (exclusion_x + exclusion_width) {
            errors.push(ValidationError::ExclusionWidthError(
                ExclusionWidthError::LargerThanBoard,
            ))
        }
    });

    some!(input, board_height, exclusion_y, exclusion_height, {
        if board_height < (exclusion_y + exclusion_height) {
            errors.push(ValidationError::ExclusionHeightError(
                ExclusionHeightError::LargerThanBoard,
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
