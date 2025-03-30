use std::{fs, path::Path};

use criterion::{black_box, criterion_group, criterion_main, Criterion};
use mmft_board_router::{board_router::route, utils::read_input_from_file};
use walkdir::WalkDir;

const DIR: &str = "./benches/cases/";
const TARGET_DIR: &str = "./target/criterion/";

fn criterion_benchmark(c: &mut Criterion) {
    let _ = fs::remove_dir_all(Path::new(TARGET_DIR));
    for group in WalkDir::new(DIR)
        .min_depth(1)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if !group.path().is_dir() {
            continue;
        }

        let group_name = match group.path().components().last().unwrap() {
            std::path::Component::Normal(os_str) => os_str.to_str().unwrap().to_owned(),
            _ => panic!(),
        };

        let mut benchmark_group = c.benchmark_group(group_name);
        for case in WalkDir::new(group.path())
            .min_depth(1)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if case.path().is_file()
                && case
                    .path()
                    .extension()
                    .unwrap()
                    .eq_ignore_ascii_case("json")
            {
                let input = read_input_from_file(case.path()).expect("Error reading configuration");

                benchmark_group.bench_function(case.path().to_str().unwrap(), |b| {
                    b.iter(|| {
                        route(black_box(&input)).expect("No solution found");
                    })
                });
            }
        }
    }
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
