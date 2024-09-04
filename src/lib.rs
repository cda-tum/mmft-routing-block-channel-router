mod board_router;
mod board_router_wasm;
mod graph_search;

pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {


    use board_router::{
        route, validate, Layout, RouteInput, ValidateInputRaw
    };

    use super::*;

    #[test]
    fn it_validates() {
        let result = validate(ValidateInputRaw {
            channel_width: Some(100.0),
            channel_spacing: Some(100.0),
            board_width: Some(10000.0),
            board_height: Some(5000.0),
            pitch: Some(500.0),
            pitch_offset_x: Some(500.0),
            pitch_offset_y: Some(500.0),
            min_grid_size: None,
            max_ports: Some(20000.0),
            layout: Some(Layout::Rectilinear),
            connections: Some(Vec::new()),
        });

        println!("{:?}", result)
    }

    #[test]
    fn it_routes() {
        let channel_width = 100;
        let result = route(RouteInput {
            channel_width: channel_width,
            channel_spacing: 100,
            board_width: 10000,
            board_height: 5000,
            pitch: 500,
            pitch_offset_x: 500,
            pitch_offset_y: 500,
            min_grid_size: 0,
            max_ports: 20000,
            layout: Layout::Octilinear,
            connections: Vec::from([(0, ((5, 5), (9, 6))), (1, ((7, 6), (8, 6)))]),
        });

        println!("{:?}", result);

        /* Dependency does not compile to Webassembly
        if let Ok(BoardRouterOutputBoard { connections }) = result {
            let dxf = generate_dxf(GenerateDXFInput {
                channel_width,
                connections
            });
            println!("{:?}", dxf);
        }*/
    }
}
