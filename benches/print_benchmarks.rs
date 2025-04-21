use std::{
    fs::{self},
    path::{Path, PathBuf},
};

use clap::Parser;
use mmft_board_router::{
    board_router::{route, BoardRouterOutputError},
    dxf::{generate_svg, GenerateSVGInput, GenerateSVGOutput},
    utils::read_input_from_file,
};
use walkdir::WalkDir;

const DIR: &str = "./benches/cases";

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    #[arg(short, long)]
    file: Option<String>,
}

fn main() {
    let args = Args::parse();

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
    }
}

fn print_benchmark_for_file(file_name: &str) {
    let file = Path::new(&file_name);
    let input = match read_input_from_file(file) {
        Ok(r) => r,
        Err(e) => {println!("{:?}", e); return},
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
        port_diameter: Some(input.port_diameter)
    });
    let mut svg_file_name = PathBuf::from(file);
    svg_file_name.set_extension("svg");
    fs::write(svg_file_name, svg).expect("Could not write SVG to file");
}
