pub mod board_router;
mod board_router_wasm;
mod graph_search;
mod validation;
mod dxf;
mod port_nomenclature;
pub mod utils;


#[cfg(test)]
mod tests {


    use board_router::{
        route, Layout, RouteInput
    };
    use validation::{validate, ValidateInput};

    use super::*;

    #[test]
    fn it_validates() {
        let result = validate(ValidateInput {
            channel_width: Some(100.0),
            channel_spacing: Some(100.0),
            board_width: Some(10000.0),
            board_height: Some(5000.0),
            pitch: Some(500.0),
            pitch_offset_x: Some(500.0),
            pitch_offset_y: Some(500.0),
            port_diameter: Some(200.0),
            max_ports: Some(20000),
            layout: Some(Layout::Rectilinear),
            connections: Some(Vec::new()),
        });

        println!("{:?}", result)
    }

    #[test]
    fn it_routes() {
        let channel_width: f64 = 100.;
        let result = route(&RouteInput {
            channel_width: channel_width,
            channel_spacing: 100.,
            board_width: 10000.,
            board_height: 5000.,
            pitch: 500.,
            pitch_offset_x: 500.,
            pitch_offset_y: 500.,
            port_diameter: 200.,
            max_ports: 20000,
            layout: Layout::Octilinear,
            connections: Vec::from([(0, vec![(5, 5), (5, 7)]), (1, vec![(6, 5), (6, 7)]), (2, vec![(7, 5), (7, 7)]), (3, vec![(8, 5), (8, 7)]), (4, vec![(9, 5), (9, 7)]), (0, vec![(4, 6), (10, 6)])]),
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

    #[test]
    fn test() {
        let result = route(&RouteInput {
            channel_width: 100.,
            channel_spacing: 100.,
            board_width: 2000.,
            board_height: 2000.,
            pitch: 500.,
            pitch_offset_x: 500.,
            pitch_offset_y: 500.,
            port_diameter: 200.,
            max_ports: 20000,
            layout: Layout::Octilinear,
            connections: Vec::from([(0, vec![(2, 0), (1, 1)]), (1, vec![(0, 0), (2, 2)])]),
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

    #[test]
    fn star_like_connections() {
        let result = route(&RouteInput {
            channel_width: 100.,
            channel_spacing: 100.,
            board_width: 10000.,
            board_height: 5000.,
            pitch: 500.,
            pitch_offset_x: 500.,
            pitch_offset_y: 500.,
            port_diameter: 200.,
            max_ports: 20000,
            layout: Layout::Octilinear,
            connections: Vec::from([
                (0, vec![(5, 5), (11, 5), (8, 2), (8, 8)]), // "Plus sign"
            ]),
        });
    }

    #[test]
    fn three_point_connection() {
        let result = route(&RouteInput {
            channel_width: 100.,
            channel_spacing: 100.,
            board_width: 10000.,
            board_height: 5000.,
            pitch: 500.,
            pitch_offset_x: 500.,
            pitch_offset_y: 500.,
            port_diameter: 200.,
            max_ports: 20000,
            layout: Layout::Octilinear,
            connections: Vec::from([
                (0, vec![(5, 5), (11, 5), (8, 2), (8, 8)]),
            ]),
        });
    }

    #[test]
    fn longer_board_connection() {
        let result = route(&RouteInput {
            channel_width: 0.375,
            channel_spacing: 0.375,
            board_width: 105.,
            board_height: 15.,
            pitch: 1.5,
            pitch_offset_x: 1.5,
            pitch_offset_y: 1.5,
            port_diameter: 0.4,
            max_ports: 20000,
            layout: Layout::Octilinear,
            connections: Vec::from([
                (0, vec![(0, 0), (5, 5)]),
            ]),
        });
    }
}
