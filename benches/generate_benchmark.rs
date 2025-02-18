use std::{
    fs::{self, File},
    io::{BufWriter, Write},
    ops::Range,
    path::Path,
};

use mmft_board_router::board_router::{
    compute_ports, route, BoardRouterOutputConnection, ComputePortsInput, ComputePortsOutput,
    Layout, RouteInput, RouteInputConnection,
};
use nanoid::nanoid;
use rand::Rng;

const DIR: &str = "./benches/cases";

fn main() {
    let cases_path = Path::new(DIR);
    let test_batch = random_1();
    let test_batch_path = cases_path.join("test");
    write_to_files(&test_batch_path, &test_batch);
}

fn write_to_files(path: &Path, cases: &Vec<(String, RouteInput)>) {
    for (case_name, case_data) in cases {
        let mut file_name = case_name.clone();
        file_name.push_str(".json");
        let path = path.join(file_name);
        let writer = BufWriter::new(File::create(path).expect("File open error."));
        serde_json::to_writer(
            writer,
            &serde_json::to_value(case_data).expect("Serialization error."),
        )
        .expect("File write error.");
    }
}

struct RandomPortConnectionsOptions {
    two_port_frequency_share: f64,
    three_port_frequency_share: f64,
    four_port_frequency_share: f64,
    ports_x: usize,
    ports_y: usize,
    max_relative_distance_x: f64,
    max_relative_distance_y: f64,
}

fn random_port_connection(
    options: &RandomPortConnectionsOptions,
    occupied_ports: &Vec<(usize, usize)>,
) -> Vec<(usize, usize)> {
    let mut rng = rand::rng();
    let total_frequencies = options.two_port_frequency_share
        + options.three_port_frequency_share
        + options.four_port_frequency_share;
    let ports = match rng.random_range(0. ..total_frequencies) {
        v if v < options.two_port_frequency_share => 2,
        v if v < options.two_port_frequency_share + options.three_port_frequency_share => 3,
        _ => 4,
    };

    let mut candidates = Vec::new();

    while candidates.len() < ports {
        let mut candidate: Option<(usize, usize)> = None;
        while candidate.is_none()
            || candidates.iter().any(|c: &(usize, usize)| {
                c.0.abs_diff(candidate.unwrap().0) as f64 / options.ports_x as f64
                    > options.max_relative_distance_x
                    || c.1.abs_diff(candidate.unwrap().1) as f64 / options.ports_y as f64
                        > options.max_relative_distance_y
            })
        {
            let port = loop {
                let port = (
                    rng.random_range(0..options.ports_x),
                    rng.random_range(0..options.ports_y),
                );
                if occupied_ports.contains(&port) || candidates.contains(&port) {
                    continue;
                } else {
                    break port;
                }
            };
            candidate = Some(port);
        }
        let p = candidate.unwrap();
        candidates.push(p);
    }

    candidates
}

fn random_port_connections(
    n_connections: usize,
    options: &RandomPortConnectionsOptions,
) -> Vec<(usize, Vec<(usize, usize)>)> {
    let mut occupied = Vec::new();
    (0..n_connections)
        .map(|i| {
            let connection = random_port_connection(&options, &occupied);
            connection.iter().for_each(|c| occupied.push(*c));
            (i, connection)
        })
        .collect()
}

fn random_port_connections_incremental(
    n_connections: usize,
    options: &RandomPortConnectionsOptions,
    is_valid: impl Fn(&Vec<RouteInputConnection>) -> bool,
    tries_per_connection: usize,
) -> Result<Vec<(usize, Vec<(usize, usize)>)>, ()> {
    let mut occupied = Vec::new();
    let mut connections = Vec::new();
    for i in 0..n_connections {
        for j in 0..tries_per_connection {
            let connection = random_port_connection(&options, &mut occupied);
            connections.push((i, connection.clone()));
            let is_valid = is_valid(&connections);
            if !is_valid {
                if j == tries_per_connection - 1 {
                    return Err(());
                }
                connections.pop();
            } else {
                connection.iter().for_each(|c| occupied.push(*c));
                break;
            }
        }
    }
    Ok(connections)
}

fn random_1() -> Vec<(String, RouteInput)> {
    let n_cases = 5;
    let n_tries = 10 * n_cases;
    let use_incremental = true;
    let n_connections = 50;
    let incremental_tries_per_connection = n_connections / 2;

    let board_width = 105.;
    let board_height = 15.;
    let channel_width = 0.25;
    let channel_spacing = 0.1;
    let pitch = 1.5;
    let pitch_offset_x = 3.;
    let pitch_offset_y = 3.;
    let port_diameter = 0.5;
    let layout = Layout::Octilinear;
    let max_ports = 5000;

    let ComputePortsOutput { ports_x, ports_y } = compute_ports(ComputePortsInput {
        board_width,
        board_height,
        pitch,
        pitch_offset_x,
        pitch_offset_y,
    });

    let options = RandomPortConnectionsOptions {
        two_port_frequency_share: 0.8,
        three_port_frequency_share: 0.1,
        four_port_frequency_share: 0.1,
        ports_x,
        ports_y,
        max_relative_distance_x: 0.5,
        max_relative_distance_y: 0.5,
    };

    let mut cases = Vec::new();

    for i in 0..n_tries {
        if i > 0 {
            print!("\r");
        }
        print!("Round {} of {}. Found: {}.", i, n_tries, cases.len());
        std::io::stdout().flush().unwrap();
        if cases.len() >= n_cases {
            println!("{} cases generated in {} tries.", n_cases, i);
            break;
        }

        let connections = if use_incremental {
            let r = random_port_connections_incremental(
                n_connections,
                &options,
                |connections| {
                    has_successful_result(&RouteInput {
                        board_width,
                        board_height,
                        pitch,
                        pitch_offset_x,
                        pitch_offset_y,
                        port_diameter,
                        channel_width,
                        channel_spacing,
                        layout,
                        max_ports,
                        connections: connections.clone(),
                    })
                },
                incremental_tries_per_connection
            );
            match r {
                Ok(v) => v,
                Err(_) => continue,
            }
        } else {
            random_port_connections(
                n_connections,
                &options
            )
        };

        let input = RouteInput {
            board_width,
            board_height,
            pitch,
            pitch_offset_x,
            pitch_offset_y,
            port_diameter,
            channel_width,
            channel_spacing,
            layout,
            max_ports,
            connections,
        };

        if has_successful_result(&input) {
            cases.push((nanoid!(), input));
        }
    }

    println!("\n");

    if cases.len() < n_cases {
        panic!(
            "Could not find {} cases in {} tries. Found: {}.",
            n_cases,
            n_tries,
            cases.len()
        )
    }
    cases
}

fn has_successful_result(input: &RouteInput) -> bool {
    let result = route(input);
    match result {
        Ok(_) => true,
        Err(_) => false,
    }
}
