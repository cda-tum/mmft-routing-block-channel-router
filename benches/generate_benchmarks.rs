use std::{
    fs::{self, File},
    io::{BufWriter, Write},
    path::Path,
};

use mmft_board_router::board_router::{
    compute_ports, route, ComputePortsInput, ComputePortsOutput, Layout, RouteInput,
    RouteInputConnection,
};
use nanoid::nanoid;
use rand::Rng;

const DIR: &str = "./benches/cases";
const MAX_PORTS: usize = 100000000;

fn main() {
    let n_cases_per_group = 5;
    generate_case_group("test2", &RandomGenerationOptions {
        n_cases: n_cases_per_group,
        n_connections: 50,
        connections_3_share: 0.1,
        connections_4_share: 0.1,
        max_relative_distance_x: 0.5,
        max_relative_distance_y: 0.5,
        use_incremental: true,
    
        board_width: 105.0,
        board_height: 15.0,
        channel_width: 0.1,
        channel_spacing: 0.1,
        pitch: 1.5,
        pitch_offset_x: 3.,
        pitch_offset_y: 3.,
        port_diameter: 0.5,
        layout: Layout::Octilinear,
    });
}

fn generate_case_group(group_name: &str, options: &RandomGenerationOptions) {
    let cases_path = Path::new(DIR);
    let case_batch = random_cases(options);
    let case_batch_path = cases_path.join(group_name);
    fs::create_dir_all(&case_batch_path);
    write_to_files(&case_batch_path, &case_batch);
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
    n_connections_2: usize,
    n_connections_3: usize,
    n_connections_4: usize,
    ports_x: usize,
    ports_y: usize,
    max_relative_distance_x: f64,
    max_relative_distance_y: f64,
}

fn random_port_connection(
    ports: usize,
    options: &RandomPortConnectionsOptions,
    occupied_ports: &Vec<(usize, usize)>,
) -> Vec<(usize, usize)> {
    let mut rng = rand::rng();

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
    options: &RandomPortConnectionsOptions,
) -> Vec<(usize, Vec<(usize, usize)>)> {
    let total_connections =
        options.n_connections_2 + options.n_connections_3 + options.n_connections_4;
    let mut occupied = Vec::new();
    (0..total_connections)
        .map(|i| {
            let ports = if i < options.n_connections_4 {
                4
            } else if i < options.n_connections_3 + options.n_connections_4 {
                3
            } else {
                2
            };
            let connection = random_port_connection(ports, &options, &occupied);
            connection.iter().for_each(|c| occupied.push(*c));
            (i, connection)
        })
        .collect()
}

fn random_port_connections_incremental(
    options: &RandomPortConnectionsOptions,
    is_valid: impl Fn(&Vec<RouteInputConnection>) -> bool,
    tries_per_connection: usize,
) -> Result<Vec<(usize, Vec<(usize, usize)>)>, ()> {
    let total_connections =
        options.n_connections_2 + options.n_connections_3 + options.n_connections_4;
    let mut occupied = Vec::new();
    let mut connections = Vec::new();
    for i in 0..total_connections {
        let ports = if i < options.n_connections_4 {
            4
        } else if i < options.n_connections_3 + options.n_connections_4 {
            3
        } else {
            2
        };
        for j in 0..tries_per_connection {
            let connection = random_port_connection(ports, &options, &mut occupied);
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

struct RandomGenerationOptions {
    n_cases: usize,
    n_connections: usize,
    connections_3_share: f64,
    connections_4_share: f64,
    max_relative_distance_x: f64,
    max_relative_distance_y: f64,
    use_incremental: bool,

    board_width: f64,
    board_height: f64,
    channel_width: f64,
    channel_spacing: f64,
    pitch: f64,
    pitch_offset_x: f64,
    pitch_offset_y: f64,
    port_diameter: f64,
    layout: Layout,
}

fn random_cases(options: &RandomGenerationOptions) -> Vec<(String, RouteInput)> {
    let &RandomGenerationOptions {
        n_connections,
        n_cases,
        board_width,
        board_height,
        pitch,
        pitch_offset_x,
        pitch_offset_y,
        port_diameter,
        channel_width,
        channel_spacing,
        layout,
        use_incremental,
        ..
    } = options;
    let incremental_tries_per_connection = 4 * f64::ceil(f64::sqrt(n_connections as f64)) as usize;

    let n_connections_4 = f64::floor(options.connections_4_share * n_connections as f64) as usize;
    let n_connections_3 = f64::floor(options.connections_3_share * n_connections as f64) as usize;
    let n_connections_2 = n_connections - n_connections_3 - n_connections_4;

    let ComputePortsOutput { ports_x, ports_y } = compute_ports(ComputePortsInput {
        board_width,
        board_height,
        pitch,
        pitch_offset_x,
        pitch_offset_y,
    });

    let options = RandomPortConnectionsOptions {
        n_connections_2,
        n_connections_3,
        n_connections_4,
        ports_x,
        ports_y,
        max_relative_distance_x: options.max_relative_distance_x,
        max_relative_distance_y: options.max_relative_distance_y,
    };

    let mut cases = Vec::new();

    for i in 0..usize::MAX {
        if i > 0 {
            print!("\r");
        }
        print!("Round {}. Found: {}.", i, cases.len());
        std::io::stdout().flush().unwrap();
        if cases.len() >= n_cases {
            println!("{} cases generated in {} tries.", n_cases, i);
            break;
        }

        let connections = if use_incremental {
            let r = random_port_connections_incremental(
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
                        max_ports: MAX_PORTS,
                        connections: connections.clone(),
                    })
                },
                incremental_tries_per_connection,
            );
            match r {
                Ok(v) => v,
                Err(_) => continue,
            }
        } else {
            random_port_connections(&options)
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
            max_ports: MAX_PORTS,
            connections,
        };

        if has_successful_result(&input) {
            cases.push((nanoid!(), input));
        }

        if cases.len() == n_cases {
            break;
        }
    }

    println!("\n");
    println!("Generated {} cases.", n_cases);
    cases
}

fn has_successful_result(input: &RouteInput) -> bool {
    let result = route(input);
    match result {
        Ok(_) => true,
        Err(_) => false,
    }
}
