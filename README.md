# MMFT Routing Block Channel Router

<p align="center">
<img src="https://www.cda.cit.tum.de/research/microfluidics/logo-microfluidics-toolkit.png" style="margin:auto;width:60%"/>
</p>

The MMFT Routing Block Channel Router is a tool that creates channel connections for routing block components. 
The tool is available on our website: [https://www.cda.cit.tum.de/app/mmft-routing-block-channel-router/](https://www.cda.cit.tum.de/app/mmft-routing-block-channel-router/).
It is part of the [Munich Microfluidics Toolkit (MMFT)](https://www.cda.cit.tum.de/research/microfluidics/munich-microfluidics-toolkit/) by the [Chair for Design Automation](https://www.cda.cit.tum.de/) at the Technical University of Munich.

In case you are using our tool in your work, we would be thankful if you referred to it by citing the following publication:
```bibtex
@INPROCEEDINGS{ebner2025automatic,
	AUTHOR    = {P. Ebner and M. Emmerich and E. Safai and A. Paul and M. Odijk and J. Loessberg-Zahl and R. Wille},
	TITLE     = {{Automatic Design for Modular Microfluidic Routing Blocks}},
	BOOKTITLE = {International Conference on Computer Aided Design (ICCAD)},
	YEAR      = {2025}
}
```

## Usage

The application is available on the [CDA website](https://www.cda.cit.tum.de/app/mmft-routing-block-channel-router/).

### Development Usage

#### `wasm-pack build`

Builds the backend.

#### `npm run dev`

Runs the app locally in development mode.

#### `npm run build`

Builds the (optimized) app for production to the `build` folder.

#### `cargo bench`

Runs the benchmarks.
