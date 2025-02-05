use criterion::{black_box, criterion_group, criterion_main, Criterion};
use mmft_board_router::board_router::{route, Layout, RouteInput};


fn criterion_benchmark(c: &mut Criterion) {
    let input = RouteInput {
        channel_width: 100.,
        channel_spacing: 100.,
        board_width: 2000.,
        board_height: 2000.,
        pitch: 500.,
        pitch_offset_x: 500.,
        pitch_offset_y: 500.,
        port_diameter: 200.,
        min_grid_size: 0.,
        max_ports: 20000,
        layout: Layout::Octilinear,
        connections: Vec::from([(0, vec![(2, 0), (1, 1)]), (1, vec![(0, 0), (2, 2)])]),
    };
    c.bench_function("route", |b| b.iter(|| route(black_box(&input))));
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);