use criterion::{black_box, criterion_group, criterion_main, Criterion};
use mmft_board_router::{board_router::route, utils::read_input_from_file};
use walkdir::WalkDir;

const DIR: &str = "./benches/cases";

fn criterion_benchmark(c: &mut Criterion) {
    for entry in WalkDir::new(DIR).into_iter().filter_map(|e| e.ok()) {
        if entry.path().is_file() && entry.path().extension().unwrap().eq_ignore_ascii_case("json") {
            let input = read_input_from_file(entry.path()).expect("Error reading configuration");

            c.bench_function(entry.path().to_str().unwrap(), |b| {
                b.iter(|| {
                    route(black_box(&input)).expect("No solution found");
                })
            });
        }
    }
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
