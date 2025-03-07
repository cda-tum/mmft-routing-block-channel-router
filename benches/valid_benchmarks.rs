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
    let mut success = 0;
    let mut total = 0;
    let mut ignored = 0;
    for entry in WalkDir::new(DIR).into_iter().filter_map(|e| e.ok()) {
        if entry.path().is_file()
            && entry
                .path()
                .extension()
                .unwrap()
                .eq_ignore_ascii_case("json")
        {
            let content = read_input_from_file(entry.path());
            match content {
                Ok(input) => {
                    total += 1;
                    let result = route(&input);
                    match result {
                        Ok(_) => success += 1,
                        Err(_) => (),
                    }
                },
                Err(_) => {
                    ignored += 1
                },
            }
            print!("\r                                                   \r");
            print!("Ignored: {}; Total: {}, Successful: {}", ignored, total, success)
        }
    }
}
