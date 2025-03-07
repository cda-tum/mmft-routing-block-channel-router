use std::{
    fs::{self, File},
    io::BufWriter,
    path::{Path, PathBuf},
};

use clap::Parser;
use mmft_board_router::{
    board_router::{route, BoardRouterOutputError, Layout, Port, RouteInput, RouteInputConnection},
    dxf::{generate_svg, GenerateSVGInput, GenerateSVGOutput},
    utils::read_input_from_file,
};
use serde::Deserialize;
use walkdir::WalkDir;

const DIR: &str = "./benches/cases";

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    #[arg(short, long)]
    file: Option<String>,
}

fn main() {
    for entry in WalkDir::new(DIR).into_iter().filter_map(|e| e.ok()) {
        if entry.path().is_file()
            && entry
                .path()
                .extension()
                .unwrap()
                .eq_ignore_ascii_case("json")
        {
            let content =
                fs::read_to_string(entry.path().to_str().unwrap()).expect("Error reading file.");
            let json: serde_json::Value = serde_json::from_str(&content).expect("Invalid JSON.");

            let transformed = RouteInput {
                channel_width: json.get("channel_width").unwrap().as_f64().unwrap(),
                channel_spacing: json.get("channel_spacing").unwrap().as_f64().unwrap(),
                board_width: json.get("board_width").unwrap().as_f64().unwrap(),
                board_height: json.get("board_height").unwrap().as_f64().unwrap(),
                layout: Layout::deserialize(json.get("layout").unwrap()).unwrap(),
                pitch: json.get("pitch").unwrap().as_f64().unwrap(),
                pitch_offset_x: json.get("pitch_offset_x").unwrap().as_f64().unwrap(),
                pitch_offset_y: json.get("pitch_offset_y").unwrap().as_f64().unwrap(),
                port_diameter: json.get("port_diameter").unwrap().as_f64().unwrap(),
                max_ports: json.get("max_ports").unwrap().as_u64().unwrap() as usize,
                connections: json
                    .get("connections")
                    .unwrap()
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|c| {
                        let t = c.as_array().unwrap();
                        RouteInputConnection {
                            id: t.get(0).unwrap().as_u64().unwrap() as usize,
                            ports: t
                                .get(1)
                                .unwrap()
                                .as_array()
                                .unwrap()
                                .iter()
                                .map(|p| Port::deserialize(p).unwrap())
                                .collect(),
                            branch_port: None,
                        }
                    })
                    .collect(),
            };

            let writer = BufWriter::new(
                File::create(entry.path().to_str().unwrap()).expect("File open error."),
            );
            serde_json::to_writer_pretty(
                writer,
                &serde_json::to_value(transformed).expect("Serialization error."),
            )
            .expect("File write error.");
        }
    }
    /*let args = Args::parse();

    match args.file {
        Some(file_name) => print_benchmark_for_file(file_name.as_str()),
        None => {
            for entry in WalkDir::new(DIR).into_iter().filter_map(|e| e.ok()) {
                if entry.path().is_file()
                    && entry
                        .path()
                        .extension()
                        .unwrap()
                        .eq_ignore_ascii_case("json")
                {
                    print_benchmark_for_file(entry.path().to_str().unwrap());
                }
            }
        }
    }*/
}

fn print_benchmark_for_file(file_name: &str) {
    let file = Path::new(&file_name);
    let input = match read_input_from_file(file) {
        Ok(r) => r,
        Err(_) => return,
    };
    let result = route(&input);
    let connections = match result {
        Ok(r) => r,
        Err(BoardRouterOutputError::PartialResult(r)) => r,
        _ => panic!("No result"),
    };
    let GenerateSVGOutput(svg) = generate_svg(GenerateSVGInput {
        connections,
        board_width: input.board_width,
        board_height: input.board_height,
        channel_width: input.channel_width,
        channel_cap: mmft_board_router::dxf::ChannelCap::Butt,
    });
    let mut svg_file_name = PathBuf::from(file);
    svg_file_name.set_extension("svg");
    fs::write(svg_file_name, svg).expect("Could not write SVG to file");
}
