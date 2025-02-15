use std::path::Path;

use clap::Parser;
use mmft_board_router::{board_router::route, utils::read_input_from_file};

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Name of the person to greet
    #[arg(short, long)]
    file: Option<String>
}

fn main() {
    let args = Args::parse();
    let file_name = args.file.expect("No file specified");
    let file = Path::new(&file_name);
    let input = read_input_from_file(file).expect("Not a valid configuration");
    let result = route(&input);
}