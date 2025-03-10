# Benchmarks

Benchmark results are stored in `cases/aggregate.json` along the cases group folders. The naming scheme is as follows: 

```
ID_SIZE_NCONNECTIONS_CHANNELSIZE_LAYOUT
```

where `ID` is a the group's unique identifier, `SIZE` is the size of the routing block (e.g., 30mm x 15mm), `NCONNECTIONS` is the number of connections (including 3 and 4-port connections), `CHANNELSIZE` is the channel width as well as channel spacing value used, and `LAYOUT` is either `R` for rectilinear or `O` for octilinear.

## Run Benchmarks

```sh
cargo bench
```

Then, to compute aggregate results:

```sh
cargo run --release --bin compute_group_aggregates
```

## Generate Benchmarks

```sh
cargo run --release --bin generate_benchmarks
```

## Print Benchmark Images
Generate SVG images *for all* cases.
```sh
cargo run --release --bin print_benchmarks
```

## Validate Benchmarks
Counts benchmarks in `cases` folder and prints how many are valid.
```sh
cargo run --release --bin valid_benchmarks
```
