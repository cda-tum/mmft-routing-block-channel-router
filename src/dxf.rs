use core::f64;
use std::io::{self, Cursor, Error, Result, Write};

use serde::{Deserialize, Serialize};

use crate::board_router::{BoardRouterOutputBoard, Channel, Point};

struct OctilinearOutlineInput {
    channels: Vec<Channel>,
    channel_width: f64,
    channel_cap: ChannelCap,
}

#[derive(Serialize, Deserialize)]
#[derive(Clone, Copy)]
pub struct ExceedBy(f64);

#[derive(Serialize, Deserialize)]
#[derive(Clone, Copy)]
pub enum ChannelCap {
    Butt,
    Square,
    Custom(ExceedBy),
}

#[derive(PartialEq, Eq, PartialOrd, Ord, Copy, Clone)]
enum Orientation {
    N,
    NE,
    E,
    SE,
    S,
    SW,
    W,
    NW,
}

impl Orientation {
    fn cw_get_shift(&self, other: &Orientation) -> usize {
        match self {
            Orientation::N => match other {
                Orientation::N => 0,
                Orientation::NE => 1,
                Orientation::E => 2,
                Orientation::SE => 3,
                Orientation::S => 4,
                Orientation::SW => 5,
                Orientation::W => 6,
                Orientation::NW => 7,
            },
            Orientation::NE => match other {
                Orientation::N => 7,
                Orientation::NE => 0,
                Orientation::E => 1,
                Orientation::SE => 2,
                Orientation::S => 3,
                Orientation::SW => 4,
                Orientation::W => 5,
                Orientation::NW => 6,
            },
            Orientation::E => match other {
                Orientation::N => 6,
                Orientation::NE => 7,
                Orientation::E => 0,
                Orientation::SE => 1,
                Orientation::S => 2,
                Orientation::SW => 3,
                Orientation::W => 4,
                Orientation::NW => 5,
            },
            Orientation::SE => match other {
                Orientation::N => 5,
                Orientation::NE => 6,
                Orientation::E => 7,
                Orientation::SE => 0,
                Orientation::S => 1,
                Orientation::SW => 2,
                Orientation::W => 3,
                Orientation::NW => 4,
            },
            Orientation::S => match other {
                Orientation::N => 4,
                Orientation::NE => 5,
                Orientation::E => 6,
                Orientation::SE => 7,
                Orientation::S => 0,
                Orientation::SW => 1,
                Orientation::W => 2,
                Orientation::NW => 3,
            },
            Orientation::SW => match other {
                Orientation::N => 3,
                Orientation::NE => 4,
                Orientation::E => 5,
                Orientation::SE => 6,
                Orientation::S => 7,
                Orientation::SW => 0,
                Orientation::W => 1,
                Orientation::NW => 2,
            },
            Orientation::W => match other {
                Orientation::N => 2,
                Orientation::NE => 3,
                Orientation::E => 4,
                Orientation::SE => 5,
                Orientation::S => 6,
                Orientation::SW => 7,
                Orientation::W => 0,
                Orientation::NW => 1,
            },
            Orientation::NW => match other {
                Orientation::N => 1,
                Orientation::NE => 2,
                Orientation::E => 3,
                Orientation::SE => 4,
                Orientation::S => 5,
                Orientation::SW => 6,
                Orientation::W => 7,
                Orientation::NW => 0,
            },
        }
    }

    fn cw_shift_by(&self, by: isize) -> Self {
        let s = by.rem_euclid(8);
        match self {
            Orientation::N => match s {
                0 => Orientation::N,
                1 => Orientation::NE,
                2 => Orientation::E,
                3 => Orientation::SE,
                4 => Orientation::S,
                5 => Orientation::SW,
                6 => Orientation::W,
                7 => Orientation::NW,
                _ => unreachable!(),
            },
            Orientation::NE => match s {
                7 => Orientation::N,
                0 => Orientation::NE,
                1 => Orientation::E,
                2 => Orientation::SE,
                3 => Orientation::S,
                4 => Orientation::SW,
                5 => Orientation::W,
                6 => Orientation::NW,
                _ => unreachable!(),
            },
            Orientation::E => match s {
                6 => Orientation::N,
                7 => Orientation::NE,
                0 => Orientation::E,
                1 => Orientation::SE,
                2 => Orientation::S,
                3 => Orientation::SW,
                4 => Orientation::W,
                5 => Orientation::NW,
                _ => unreachable!(),
            },
            Orientation::SE => match s {
                5 => Orientation::N,
                6 => Orientation::NE,
                7 => Orientation::E,
                0 => Orientation::SE,
                1 => Orientation::S,
                2 => Orientation::SW,
                3 => Orientation::W,
                4 => Orientation::NW,
                _ => unreachable!(),
            },
            Orientation::S => match s {
                4 => Orientation::N,
                5 => Orientation::NE,
                6 => Orientation::E,
                7 => Orientation::SE,
                0 => Orientation::S,
                1 => Orientation::SW,
                2 => Orientation::W,
                3 => Orientation::NW,
                _ => unreachable!(),
            },
            Orientation::SW => match s {
                3 => Orientation::N,
                4 => Orientation::NE,
                5 => Orientation::E,
                6 => Orientation::SE,
                7 => Orientation::S,
                0 => Orientation::SW,
                1 => Orientation::W,
                2 => Orientation::NW,
                _ => unreachable!(),
            },
            Orientation::W => match s {
                2 => Orientation::N,
                3 => Orientation::NE,
                4 => Orientation::E,
                5 => Orientation::SE,
                6 => Orientation::S,
                7 => Orientation::SW,
                0 => Orientation::W,
                1 => Orientation::NW,
                _ => unreachable!(),
            },
            Orientation::NW => match s {
                1 => Orientation::N,
                2 => Orientation::NE,
                3 => Orientation::E,
                4 => Orientation::SE,
                5 => Orientation::S,
                6 => Orientation::SW,
                7 => Orientation::W,
                0 => Orientation::NW,
                _ => unreachable!(),
            },
        }
    }

    fn from_vector(base: [f64; 2], towards: [f64; 2]) -> Option<Self> {
        let d = [towards[0] - base[0], towards[1] - base[1]];

        if d[0] < 0. {
            if d[1] < 0. {
                Some(Orientation::NW)
            } else if d[1] > 0. {
                Some(Orientation::SW)
            } else {
                Some(Orientation::W)
            }
        } else if d[0] > 0. {
            if d[1] < 0. {
                Some(Orientation::NE)
            } else if d[1] > 0. {
                Some(Orientation::SE)
            } else {
                Some(Orientation::E)
            }
        } else {
            if d[1] < 0. {
                Some(Orientation::N)
            } else if d[1] > 0. {
                Some(Orientation::S)
            } else {
                None
            }
        }
    }
}

fn rotate_right_by(v: &[f64; 2], by: isize) -> [f64; 2] {
    let s = by.rem_euclid(4);
    let mirror = (s / 2) == 1;
    let rotate = (s % 2) == 1;
    let mut r = *v;
    if rotate {
        r = [r[1], -r[0]];
    }

    if mirror {
        r = [-r[0], -r[1]];
    }

    r
}

pub fn octilinear_outline(
    channels: &Vec<Channel>,
    channel_width: f64,
    channel_cap: &ChannelCap,
) -> Polyline {
    if channels.len() == 1 {
        Polyline::Closed(octilinear_outline_single_channel(
            &channels[0],
            channel_width,
            channel_cap,
        ))
    } else {
        Polyline::Closed(octilinear_outline_star_shape(
            channels,
            channel_width,
            channel_cap,
        ))
    }
}

pub fn octilinear_outline_single_channel(
    channel: &Channel,
    channel_width: f64,
    channel_cap: &ChannelCap,
) -> Vec<[f64; 2]> {
    let start_point = channel[0];
    let start_orientation = Orientation::from_vector(start_point, channel[1]).unwrap();
    let start_points = end_points(start_point, start_orientation, channel_width, channel_cap);

    let mut outline_points = Vec::from(start_points);

    let mut left_list = Vec::new();
    let mut right_list = Vec::new();
    for i in 1..channel.len() - 1 {
        let point = channel[i];
        let previous_point = channel[i - 1];
        let next_point = channel[i + 1];
        let previous_orientation = Orientation::from_vector(point, previous_point).unwrap();
        let next_orientation = Orientation::from_vector(point, next_point).unwrap();
        let join_points_1 =
            next_cw_join_points(previous_orientation, next_orientation, channel_width);
        match join_points_1 {
            JoinPoints::None => todo!(),
            JoinPoints::One(point) => left_list.push(point),
        }
        let join_points_2 =
            next_cw_join_points(next_orientation, previous_orientation, channel_width);
        match join_points_2 {
            JoinPoints::None => todo!(),
            JoinPoints::One(point) => right_list.push(point),
        }
    }

    let end_point = channel[channel.len() - 1];
    let end_orientation = Orientation::from_vector(end_point, channel[channel.len() - 2]).unwrap();
    let end_points = end_points(end_point, end_orientation, channel_width, channel_cap);

    right_list.reverse();

    outline_points.append(&mut left_list);
    outline_points.append(&mut Vec::from(end_points));
    outline_points.append(&mut right_list);

    return outline_points;
}

pub fn octilinear_outline_star_shape(
    channels: &Vec<Channel>,
    channel_width: f64,
    channel_cap: &ChannelCap,
) -> Vec<[f64; 2]> {
    let base_point = channels[0][0];
    let mut ordered_channels = channels.clone();
    ordered_channels.sort_by(|a, b| {
        Orientation::from_vector(base_point, a[1])
            .unwrap()
            .cmp(&Orientation::from_vector(base_point, b[1]).unwrap())
    });
    let n_groups = ordered_channels.len();
    let mut outline_points = Vec::new();
    let mut previous_anchor_point = ordered_channels[n_groups - 1][1];
    for channel in ordered_channels {
        let previous_orientation =
            Orientation::from_vector(base_point, previous_anchor_point).unwrap();
        let current_anchor_point = channel[1];
        let current_orientation =
            Orientation::from_vector(base_point, current_anchor_point).unwrap();

        let join_points =
            next_cw_join_points(previous_orientation, current_orientation, channel_width);

        match join_points {
            JoinPoints::One(point) => outline_points.push(point),
            _ => (),
        }

        let mut left_list = Vec::new();
        let mut right_list = Vec::new();
        for i in 1..channel.len() - 1 {
            let point = channel[i];
            let previous_point = channel[i - 1];
            let next_point = channel[i + 1];
            let previous_orientation = Orientation::from_vector(point, previous_point).unwrap();
            let next_orientation = Orientation::from_vector(point, next_point).unwrap();
            let join_points_1 =
                next_cw_join_points(previous_orientation, next_orientation, channel_width);
            match join_points_1 {
                JoinPoints::None => todo!(),
                JoinPoints::One(point) => left_list.push(point),
            }
            let join_points_2 =
                next_cw_join_points(next_orientation, previous_orientation, channel_width);
            match join_points_2 {
                JoinPoints::None => todo!(),
                JoinPoints::One(point) => right_list.push(point),
            }
        }

        let end_point = channel[channel.len() - 1];
        let end_orientation =
            Orientation::from_vector(end_point, channel[channel.len() - 2]).unwrap();
        let end_points = end_points(end_point, end_orientation, channel_width, channel_cap);

        right_list.reverse();

        outline_points.append(&mut left_list);
        outline_points.append(&mut Vec::from(end_points));
        outline_points.append(&mut right_list);

        previous_anchor_point = current_anchor_point;
    }

    return outline_points;
}

enum JoinPoints {
    None,
    One([f64; 2]),
}

impl JoinPoints {
    fn rotate_right_by(&self, by: isize) -> JoinPoints {
        match self {
            JoinPoints::None => JoinPoints::None,
            JoinPoints::One(point) => JoinPoints::One(rotate_right_by(point, by)),
        }
    }
}

fn next_cw_join_points(
    current_orientation: Orientation,
    next_orientation: Orientation,
    channel_width: f64,
) -> JoinPoints {
    match current_orientation {
        Orientation::N | Orientation::E | Orientation::S | Orientation::W => {
            let shift = current_orientation.cw_get_shift(&Orientation::N);
            let next_shifted = next_orientation.cw_shift_by(shift as isize);
            let join_points = next_cw_join_points_start_n(next_shifted, channel_width);
            join_points.rotate_right_by((shift / 2) as isize)
        }
        Orientation::NE | Orientation::SE | Orientation::SW | Orientation::NW => {
            let shift = current_orientation.cw_get_shift(&Orientation::NE);
            let next_shifted = next_orientation.cw_shift_by(shift as isize);
            let join_points = next_cw_join_points_start_ne(next_shifted, channel_width);
            join_points.rotate_right_by((shift / 2) as isize)
        }
    }
}

fn next_cw_join_points_start_n(next_orientation: Orientation, channel_width: f64) -> JoinPoints {
    let w = channel_width;

    match next_orientation {
        Orientation::N => unreachable!(),
        Orientation::NE => JoinPoints::One([w / 2., -w * f64::consts::SQRT_2 - w / 2.]),
        Orientation::E => JoinPoints::One([w, -w]),
        Orientation::SE => JoinPoints::One([w / 2., -w * f64::consts::SQRT_2 + w / 2.]),
        Orientation::S => JoinPoints::None,
        Orientation::SW => JoinPoints::One([w / 2., w * f64::consts::SQRT_2 - w / 2.]),
        Orientation::W => JoinPoints::One([w, w]),
        Orientation::NW => JoinPoints::One([w / 2., w * f64::consts::SQRT_2 + w / 2.]),
    }
}

fn next_cw_join_points_start_ne(next_orientation: Orientation, channel_width: f64) -> JoinPoints {
    let w = channel_width;
    match next_orientation {
        Orientation::N => JoinPoints::One([-w / 2., w * f64::consts::SQRT_2 + w / 2.]),
        Orientation::NE => unreachable!(),
        Orientation::E => JoinPoints::One([w * f64::consts::SQRT_2 + w / 2., -w / 2.]),
        Orientation::SE => JoinPoints::One([w * f64::consts::SQRT_2, 0.]),
        Orientation::S => JoinPoints::One([w / 2., w * f64::consts::SQRT_2 - w / 2.]),
        Orientation::SW => JoinPoints::None,
        Orientation::W => JoinPoints::One([w * f64::consts::SQRT_2 - w / 2., w / 2.]),
        Orientation::NW => JoinPoints::One([0., w * f64::consts::SQRT_2]),
    }
}

fn end_points(
    end_point: [f64; 2],
    orientation: Orientation,
    channel_width: f64,
    channel_cap: &ChannelCap,
) -> [[f64; 2]; 2] {
    let w = channel_width;
    let r = w * f64::consts::SQRT_2;
    let [px, py] = end_point;

    let la = match channel_cap {
        ChannelCap::Butt => 0.,
        ChannelCap::Square => w / 2.,
        ChannelCap::Custom(ExceedBy(exceed_by)) => *exceed_by,
    };

    let lb = la * f64::consts::SQRT_2;

    match orientation {
        Orientation::N => [[px + w, py + la], [px - w, py + la]],
        Orientation::NE => [[px + r - lb, py + r + lb], [px - r - lb, py - r + lb]],
        Orientation::E => [[px - la, py + w], [px - la, py - w]],
        Orientation::SE => [[px - r - lb, py + r - lb], [px + r - lb, py - r - lb]],
        Orientation::S => [[px - w, py - la], [px + w, py - la]],
        Orientation::SW => [[px - r + lb, py - r - lb], [px - r - lb, py + r - lb]],
        Orientation::W => [[px + la, py - w], [px + la, py + w]],
        Orientation::NW => [[px + r + lb, py - r + lb], [px - r + lb, py + r + lb]],
    }
}

pub enum DXFEntity {
    Polyline(Polyline),
    Line(Line),
}

pub enum Polyline {
    Closed(Vec<Point>),
    Open(Vec<Point>),
}

pub struct Line {
    from: [f64; 2],
    to: [f64; 2],
}

fn write_dxf<W: Write>(out: &mut W, entities: &[DXFEntity]) -> Result<()> {
    write_dxf_head(out)?;
    write_dxf_entities(out, entities)?;
    write_dxf_end(out)?;
    Ok(())
}

fn write_dxf_entities<W: Write>(out: &mut W, entities: &[DXFEntity]) -> Result<()> {
    for entity in entities {
        match entity {
            DXFEntity::Polyline(polyline) => write_dxf_polyline(out, polyline)?,
            DXFEntity::Line(line) => write_dxf_line(out, line)?,
        }
    }

    Ok(())
}

fn write_dxf_polyline<W: Write>(out: &mut W, polyline: &Polyline) -> Result<()> {
    let points = match polyline {
        Polyline::Closed(points) => {
            let n_points = points.len();
            if n_points > 0 {
                write_dxf_line(
                    out,
                    &Line {
                        from: points[0],
                        to: points[n_points - 1],
                    },
                )?
            }

            points
        }
        Polyline::Open(points) => points,
    };
    for w in points.windows(2) {
        write_dxf_line(
            out,
            &Line {
                from: w[0],
                to: w[1],
            },
        )?
    }
    Ok(())
}

fn write_dxf_line<W: Write>(out: &mut W, line: &Line) -> Result<()> {
    out.write_all(b"LINE\n")?;
    out.write_all(b"8\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"10\n")?;
    out.write_all(format!("{}\n", line.from[0]).as_bytes())?;
    out.write_all(b"20\n")?;
    out.write_all(format!("{}\n", line.from[1]).as_bytes())?;
    out.write_all(b"11\n")?;
    out.write_all(format!("{}\n", line.to[0]).as_bytes())?;
    out.write_all(b"21\n")?;
    out.write_all(format!("{}\n", line.to[1]).as_bytes())?;
    out.write_all(b"0\n")?;
    Ok(())
}

fn write_dxf_head<W: Write>(out: &mut W) -> Result<()> {
    out.write_all(b"0\n")?;
    out.write_all(b"SECTION\n")?;
    out.write_all(b"2\n")?;
    out.write_all(b"HEADER\n")?;
    out.write_all(b"9\n")?;
    out.write_all(b"$INSUNITS\n")?;
    out.write_all(b"70\n")?;
    out.write_all(b"4\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"ENDSEC\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"SECTION\n")?;
    out.write_all(b"2\n")?;
    out.write_all(b"TABLES\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"TABLE\n")?;
    out.write_all(b"2\n")?;
    out.write_all(b"LTYPE\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"LTYPE\n")?;
    out.write_all(b"72\n")?;
    out.write_all(b"65\n")?;
    out.write_all(b"70\n")?;
    out.write_all(b"64\n")?;
    out.write_all(b"2\n")?;
    out.write_all(b"CONTINUOUS\n")?;
    out.write_all(b"3\n")?;
    out.write_all(b"______\n")?;
    out.write_all(b"73\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"40\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"ENDTAB\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"TABLE\n")?;
    out.write_all(b"2\n")?;
    out.write_all(b"LAYER\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"ENDTAB\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"ENDSEC\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"SECTION\n")?;
    out.write_all(b"2\n")?;
    out.write_all(b"ENTITIES\n")?;
    out.write_all(b"0\n")?;
    Ok(())
}

fn write_dxf_end<W: Write>(out: &mut W) -> Result<()> {
    out.write_all(b"ENDSEC\n")?;
    out.write_all(b"0\n")?;
    out.write_all(b"EOF")?;
    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct GenerateDXFInput {
    connections: BoardRouterOutputBoard,
    channel_width: f64,
    channel_cap: ChannelCap
}

#[derive(Serialize, Deserialize)]
pub struct GenerateDXFOutput(String);

pub fn generate_dxf(input: GenerateDXFInput) -> GenerateDXFOutput {
    let mut s = Vec::new();
    let mut buf = Cursor::new(&mut s);
    let _ = write_dxf(&mut buf, &input.connections.connections.iter().map(|(_, connection)| DXFEntity::Polyline(octilinear_outline(connection, input.channel_width, &input.channel_cap))).collect::<Vec<DXFEntity>>());
    GenerateDXFOutput(String::from_utf8(s).unwrap())
}
