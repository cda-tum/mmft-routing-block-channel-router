import { SxProps } from "@mui/joy/styles/types"

export function MMFTIcon(props: {
    primaryColor?: string
    secondaryColor?: string
    width?: number | string
    height: number | string
    style?: React.CSSProperties
}) {
    const primaryColor = props.primaryColor ?? '#3d3d3c'
    const secondaryColor = props.secondaryColor ?? '#026fb7'
    return <svg
        width={props.width}
        height={props.height}
        style={props.style}
        viewBox="0 0 610 300"
    >
        <defs>
            <clipPath
                clipPathUnits="userSpaceOnUse">
                <path
                    d="M 0,402.416 H 613.326 V 0 H 0 Z" />
            </clipPath>
        </defs>
        <g
            transform="matrix(1,0,0,-1,0,350)">
            <g>
                <g>
                    <g
                        transform="translate(228.5005,208.8693)">
                        <path
                            d="m 0,0 c -3.072,0 -5.562,2.49 -5.562,5.562 v 46.284 c 0,3.072 2.49,5.562 5.562,5.562 3.072,0 5.562,-2.49 5.562,-5.562 V 5.562 C 5.562,2.49 3.072,0 0,0"
                            style={{
                                fill: primaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(185.1402,134.8453)">
                        <path
                            d="m 0,0 h -36.731 c -7.667,0 -13.905,6.238 -13.905,13.905 v 29.446 c 0,1.518 -1.235,2.765 -2.754,2.781 l -15.13,0.153 h -46.228 c -3.072,0 -5.562,2.49 -5.562,5.562 0,3.072 2.49,5.562 5.562,5.562 h 46.284 l 15.187,-0.154 c 7.59,-0.077 13.765,-6.314 13.765,-13.904 V 13.905 c 0,-1.534 1.247,-2.781 2.781,-2.781 H 0 c 3.072,0 5.562,-2.49 5.562,-5.562 C 5.562,2.49 3.072,0 0,0"
                            style={{
                                fill: primaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(70.9973,134.8453)">
                        <path
                            d="m 0,0 c -3.072,0 -5.562,2.49 -5.562,5.562 v 19.506 c 0,4.983 4.054,9.038 9.038,9.038 h 41.598 c 3.072,0 5.562,-2.49 5.562,-5.562 0,-3.072 -2.49,-5.562 -5.562,-5.562 H 5.562 V 5.562 C 5.562,2.49 3.072,0 0,0"
                            style={{
                                fill: primaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(408.3501,254.9739)">
                        <path
                            d="m 0,0 c -1.534,0 -2.781,-1.248 -2.781,-2.781 v -29.264 c 0,-1.534 1.247,-2.781 2.781,-2.781 h 47.594 c 1.534,0 2.781,1.247 2.781,2.781 V -2.781 C 50.375,-1.248 49.128,0 47.594,0 Z M 47.594,-45.95 H 0 c -7.667,0 -13.905,6.238 -13.905,13.905 v 29.264 c 0,7.667 6.238,13.905 13.905,13.905 h 47.594 c 7.668,0 13.905,-6.238 13.905,-13.905 v -29.264 c 0,-7.667 -6.237,-13.905 -13.905,-13.905"
                            style={{
                                fill: primaryColor,
                                stroke: 'none'
                            }} id="path32" />
                    </g>
                    <g
                        transform="translate(381.3805,208.868)">
                        <path
                            d="m 0,0 c -0.844,0 -1.7,0.193 -2.505,0.599 l -34.911,17.643 -0.595,0.565 c -2.183,2.078 -2.871,5.229 -1.753,8.027 1.119,2.799 3.79,4.607 6.803,4.607 h 20.451 c 1.534,0 2.781,1.248 2.781,2.781 v 9.103 c 0,1.533 -1.247,2.781 -2.781,2.781 h -36.47 c -1.534,0 -2.782,-1.248 -2.782,-2.782 L -51.763,14.061 C -51.763,6.394 -58,0.156 -65.667,0.156 h -54.705 c -7.668,0 -13.905,6.238 -13.905,13.905 v 29.264 c 0,7.667 6.237,13.905 13.905,13.905 h 46.899 c 3.072,0 5.562,-2.49 5.562,-5.562 0,-3.072 -2.49,-5.562 -5.562,-5.562 h -46.899 c -1.534,0 -2.781,-1.248 -2.781,-2.781 V 14.061 c 0,-1.534 1.247,-2.781 2.781,-2.781 h 54.705 c 1.533,0 2.781,1.247 2.781,2.781 v 29.264 c 0.002,7.668 6.239,13.905 13.906,13.905 h 36.47 c 7.667,0 13.905,-6.238 13.905,-13.905 v -9.103 c 0,-7.667 -6.238,-13.904 -13.905,-13.904 h -4.35 L 2.513,10.527 C 5.254,9.142 6.354,5.796 4.968,3.055 3.989,1.118 2.031,0 0,0"
                            style={{
                                fill: primaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(352.7401,134.8453)">
                        <path
                            d="m 0,0 h -46.899 c -3.072,0 -5.562,2.49 -5.562,5.562 0,3.072 2.49,5.562 5.562,5.562 H 0 c 1.534,0 2.781,1.247 2.781,2.781 v 29.256 c 0,1.538 -1.251,2.789 -2.79,2.789 h -46.89 c -3.072,0 -5.562,2.49 -5.562,5.562 0,3.072 2.49,5.562 5.562,5.562 h 46.89 c 7.672,0 13.914,-6.241 13.914,-13.913 V 13.905 C 13.905,6.238 7.667,0 0,0"
                            style={{
                                fill: primaryColor,
                                stroke: 'none'
                            }}
                        />
                    </g>
                    <g
                        transform="translate(250.9165,134.8453)">
                        <path
                            d="M 0,0 H -42.033 C -49.7,0 -55.938,6.238 -55.938,13.905 v 37.72 c 0,3.072 2.49,5.562 5.562,5.562 3.072,0 5.562,-2.49 5.562,-5.562 v -37.72 c 0,-1.534 1.248,-2.781 2.781,-2.781 H 0 c 1.534,0 2.781,1.247 2.781,2.781 v 37.72 c 0,3.072 2.49,5.562 5.562,5.562 3.071,0 5.562,-2.49 5.562,-5.562 V 13.905 C 13.905,6.238 7.667,0 0,0"
                            style={{
                                fill: primaryColor,
                                stroke: 'none'
                            }}
                        />
                    </g>
                    <g
                        transform="translate(518.9844,168.951)">
                        <path
                            d="m 0,0 h -33.016 c -1.527,0 -2.77,1.037 -2.77,2.312 v 7.223 c 0,1.281 1.248,2.323 2.781,2.323 H 8.333 c 3.071,0 5.562,2.49 5.562,5.562 0,3.072 -2.491,5.562 -5.562,5.562 h -41.338 c -7.667,0 -13.904,-6.032 -13.904,-13.447 V 2.312 c 0,-7.408 6.232,-13.436 13.893,-13.436 H 0 c 1.528,0 2.771,-1.037 2.771,-2.312 v -7.223 c 0,-1.281 -1.248,-2.323 -2.781,-2.323 h -101.586 c -1.534,0 -2.781,1.248 -2.781,2.781 V 9.064 c 0,1.533 1.247,2.781 2.781,2.781 h 43.423 c 3.071,0 5.562,2.49 5.562,5.562 0,3.072 -2.491,5.562 -5.562,5.562 h -43.423 c -7.667,0 -13.905,-6.238 -13.905,-13.905 v -29.265 c 0,-7.667 6.238,-13.905 13.905,-13.905 H -0.01 c 7.667,0 13.905,6.032 13.905,13.447 v 7.223 C 13.895,-6.028 7.661,0 0,0"
                            style={{
                                fill: primaryColor,
                                stroke: 'none'
                            }}
                        />
                    </g>
                    <g
                        transform="translate(384.9837,134.8453)">
                        <path
                            d="m 0,0 c -3.072,0 -5.562,2.49 -5.562,5.562 v 46.285 c 0,3.072 2.49,5.562 5.562,5.562 3.072,0 5.562,-2.49 5.562,-5.562 V 5.562 C 5.562,2.49 3.072,0 0,0"
                            style={{
                                fill: primaryColor,
                                stroke: 'none'
                            }}
                        />
                    </g>
                    <g
                        id="g54"
                        transform="translate(283.2219,134.8453)">
                        <path
                            d="m 0,0 c -3.072,0 -5.562,2.49 -5.562,5.562 v 46.285 c 0,3.072 2.49,5.562 5.562,5.562 3.072,0 5.562,-2.49 5.562,-5.562 V 5.562 C 5.562,2.49 3.072,0 0,0"
                            style={{
                                fill: primaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        id="g58"
                        transform="translate(565.3289,207.5402)">
                        <path
                            d="m 0,0 c -0.834,0 -1.673,0.271 -2.376,0.83 l -18.258,14.509 c -3.001,2.385 -6.765,3.698 -10.597,3.698 h -46.197 c -2.111,0 -3.824,1.712 -3.824,3.824 0,2.112 1.713,3.824 3.824,3.824 h 46.197 c 5.553,0 11.007,-1.903 15.355,-5.359 L 2.382,6.818 C 4.035,5.503 4.31,3.098 2.996,1.445 2.241,0.495 1.126,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }}
                        />
                    </g>
                    <g
                        id="g62"
                        transform="translate(576.1119,207.5402)">
                        <path
                            d="m 0,0 c -3.569,0 -6.472,-2.903 -6.472,-6.471 0,-3.569 2.903,-6.472 6.472,-6.472 3.568,0 6.471,2.903 6.471,6.472 C 6.471,-2.903 3.568,0 0,0 m 0,-20.59 c -7.785,0 -14.119,6.334 -14.119,14.119 0,7.785 6.334,14.119 14.119,14.119 7.785,0 14.119,-6.334 14.119,-14.119 C 14.119,-14.256 7.785,-20.59 0,-20.59"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        id="g66"
                        transform="translate(118.4726,226.5773)">
                        <path
                            d="m 0,0 h -39.244 c -5.554,0 -11.008,1.903 -15.355,5.358 l -18.258,14.509 c -1.653,1.314 -1.928,3.719 -0.615,5.373 1.314,1.653 3.72,1.928 5.373,0.614 l 18.258,-14.509 c 3,-2.384 6.764,-3.697 10.597,-3.697 L 0,7.648 C 2.112,7.648 3.824,5.936 3.824,3.824 3.824,1.712 2.112,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        id="g70"
                        transform="translate(37.2145,266.2045)">
                        <path
                            d="m 0,0 c -3.569,0 -6.472,-2.903 -6.472,-6.471 0,-3.569 2.903,-6.472 6.472,-6.472 3.568,0 6.471,2.903 6.471,6.472 C 6.471,-2.903 3.568,0 0,0 m 0,-20.59 c -7.785,0 -14.119,6.334 -14.119,14.119 0,7.785 6.334,14.119 14.119,14.119 7.785,0 14.119,-6.334 14.119,-14.119 C 14.119,-14.256 7.785,-20.59 0,-20.59"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        id="g74"
                        transform="translate(421.5666,285.9801)">
                        <path
                            d="m 0,0 h -60.101 c -2.111,0 -3.823,1.712 -3.823,3.824 0,2.112 1.712,3.824 3.823,3.824 H 0 c 3.833,0 7.597,1.313 10.598,3.698 l 18.257,14.508 c 1.655,1.315 4.059,1.038 5.372,-0.614 1.314,-1.654 1.039,-4.059 -0.614,-5.373 L 15.356,5.358 C 11.007,1.903 5.554,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        id="g78"
                        transform="translate(463.5809,325.6075)">
                        <path
                            d="m 0,0 c -3.568,0 -6.471,-2.903 -6.471,-6.472 0,-3.568 2.903,-6.471 6.471,-6.471 3.569,0 6.472,2.903 6.472,6.471 C 6.472,-2.903 3.569,0 0,0 m 0,-20.591 c -7.785,0 -14.119,6.334 -14.119,14.119 0,7.786 6.334,14.12 14.119,14.12 7.785,0 14.119,-6.334 14.119,-14.12 0,-7.785 -6.334,-14.119 -14.119,-14.119"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        id="g82"
                        transform="translate(128.1492,88.0148)">
                        <path
                            d="m 0,0 c -1.126,0 -2.241,0.495 -2.996,1.445 -1.314,1.653 -1.039,4.058 0.615,5.373 l 18.257,14.509 c 4.349,3.455 9.802,5.357 15.356,5.357 h 126.843 c 2.112,0 3.824,-1.712 3.824,-3.823 0,-2.112 -1.712,-3.824 -3.824,-3.824 H 31.232 c -3.833,0 -7.597,-1.313 -10.598,-3.698 L 2.377,0.83 C 1.673,0.271 0.834,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(120.4365,88.9772)">
                        <path
                            d="m 0,0 c -3.568,0 -6.471,-2.903 -6.471,-6.471 0,-3.569 2.903,-6.472 6.471,-6.472 3.568,0 6.471,2.903 6.471,6.472 C 6.471,-2.903 3.568,0 0,0 m 0,-20.59 c -7.785,0 -14.119,6.334 -14.119,14.119 0,7.785 6.334,14.119 14.119,14.119 7.785,0 14.119,-6.334 14.119,-14.119 C 14.119,-14.256 7.785,-20.59 0,-20.59"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(203.7303,209.0238)">
                        <path
                            d="M 0,0 C -3.072,0 -5.562,2.49 -5.562,5.562 V 43.13 L -24.726,26.257 c -3.328,-2.929 -8.227,-3.01 -11.649,-0.19 L -57.707,43.646 V 5.562 C -57.707,2.49 -60.197,0 -63.269,0 -66.34,0 -68.83,2.49 -68.83,5.562 v 42.621 c 0,3.514 1.974,6.627 5.151,8.126 3.177,1.499 6.835,1.041 9.545,-1.194 l 23.426,-19.304 21.35,18.797 c 2.684,2.364 6.376,2.917 9.636,1.444 3.259,-1.473 5.284,-4.61 5.284,-8.186 V 5.562 C 5.562,2.49 3.072,0 0,0"
                            style={{
                                fill: primaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(256.4747,286.1511)">
                        <path
                            d="m 0,0 c -1.462,0 -2.648,1.186 -2.648,2.648 v 20.795 c 0,1.462 1.186,2.648 2.648,2.648 1.462,0 2.648,-1.186 2.648,-2.648 V 2.648 C 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(304.6848,286.1511)">
                        <path
                            d="m 0,0 c -1.462,0 -2.648,1.186 -2.648,2.648 v 20.795 c 0,1.462 1.186,2.648 2.648,2.648 1.462,0 2.648,-1.186 2.648,-2.648 V 2.648 C 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(333.564,286.1511)">
                        <path
                            d="m 0,0 c -1.462,0 -2.648,1.186 -2.648,2.648 v 20.795 c 0,1.462 1.186,2.648 2.648,2.648 1.462,0 2.648,-1.186 2.648,-2.648 V 2.648 C 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(333.564,296.5483)">
                        <path
                            d="m 0,0 h -27.925 c -1.462,0 -2.648,1.186 -2.648,2.648 0,1.462 1.186,2.648 2.648,2.648 H 0 C 1.462,5.296 2.648,4.11 2.648,2.648 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(293.6353,286.2261)">
                        <path
                            d="m 0,0 h -21.071 c -3.527,0 -6.396,2.869 -6.396,6.396 v 13.148 c 0,3.527 2.869,6.396 6.396,6.396 H 0 c 1.462,0 2.648,-1.185 2.648,-2.648 C 2.648,21.83 1.462,20.644 0,20.644 h -21.071 c -0.607,0 -1.1,-0.493 -1.1,-1.1 V 6.396 c 0,-0.607 0.493,-1.1 1.1,-1.1 L 0,5.296 C 1.462,5.296 2.648,4.11 2.648,2.648 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(200.1843,286.2009)">
                        <path
                            d="m 0,0 h -18.884 c -3.527,0 -6.396,2.869 -6.396,6.396 v 16.947 c 0,1.463 1.185,2.648 2.648,2.648 1.462,0 2.648,-1.185 2.648,-2.648 V 6.396 c 0,-0.607 0.493,-1.1 1.1,-1.1 L 0,5.296 c 0.606,0 1.1,0.493 1.1,1.1 v 16.947 c 0,1.463 1.186,2.648 2.648,2.648 1.463,0 2.648,-1.185 2.648,-2.648 V 6.396 C 6.396,2.869 3.527,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(166.4274,286.0383)">
                        <path
                            d="m 0,0 c -1.462,0 -2.648,1.186 -2.648,2.648 v 16.907 l -8.566,-7.542 c -1.559,-1.373 -3.856,-1.411 -5.46,-0.089 L -26.232,19.8 V 2.648 C -26.232,1.186 -27.417,0 -28.88,0 c -1.462,0 -2.648,1.186 -2.648,2.648 v 19.455 c 0,1.646 0.925,3.105 2.414,3.808 1.489,0.701 3.203,0.488 4.473,-0.559 l 10.622,-8.753 9.675,8.519 c 1.258,1.107 2.989,1.366 4.516,0.677 1.527,-0.691 2.476,-2.161 2.476,-3.837 V 2.648 C 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(242.7682,285.9801)">
                        <path
                            d="M 0,0 C -0.86,0 -1.715,0.265 -2.446,0.788 L -2.631,0.933 -24.667,19.849 V 3.05 c 0,-1.462 -1.186,-2.648 -2.648,-2.648 -1.463,0 -2.648,1.186 -2.648,2.648 v 19.17 c 0,1.585 0.875,3.019 2.284,3.744 1.408,0.724 3.085,0.602 4.374,-0.319 L -23.12,25.5 -1.083,6.584 v 17.111 c 0,1.462 1.185,2.647 2.647,2.647 1.463,0 2.648,-1.185 2.648,-2.647 V 4.212 C 4.212,2.628 3.337,1.194 1.928,0.469 1.318,0.155 0.657,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(446.8113,88.4777)">
                        <path
                            d="m 0,0 h -16.71 c -3.552,0 -6.443,2.89 -6.443,6.443 v 17.153 c 0,1.462 1.186,2.648 2.648,2.648 1.462,0 2.648,-1.186 2.648,-2.648 V 6.443 c 0,-0.632 0.515,-1.147 1.147,-1.147 L 0,5.296 C 1.462,5.296 2.648,4.11 2.648,2.648 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <path
                        d="m 387.133,93.796 h 23.946 v 15.607 H 387.133 Z M 411.147,88.5 h -24.083 c -2.882,0 -5.227,2.345 -5.227,5.227 v 15.745 c 0,2.883 2.345,5.227 5.227,5.227 h 24.083 c 2.883,0 5.228,-2.344 5.228,-5.227 V 93.727 c 0,-2.882 -2.345,-5.227 -5.228,-5.227"
                        style={{
                            fill: secondaryColor,
                            stroke: 'none'
                        }} />
                    <path
                        d="m 346.329,93.796 h 23.946 v 15.607 H 346.329 Z M 370.344,88.5 h -24.083 c -2.883,0 -5.228,2.345 -5.228,5.227 v 15.745 c 0,2.883 2.345,5.227 5.228,5.227 h 24.083 c 2.883,0 5.227,-2.344 5.227,-5.227 V 93.727 c 0,-2.882 -2.344,-5.227 -5.227,-5.227"
                        style={{
                            fill: secondaryColor,
                            stroke: 'none'
                        }} />
                    <g
                        transform="translate(497.9079,88.4237)">
                        <path
                            d="m 0,0 c -1.462,0 -2.648,1.186 -2.648,2.648 v 21.056 c 0,1.462 1.186,2.648 2.648,2.648 1.462,0 2.648,-1.186 2.648,-2.648 V 2.648 C 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(519.7025,88.4237)">
                        <path
                            d="m 0,0 c -1.462,0 -2.648,1.186 -2.648,2.648 v 21.056 c 0,1.462 1.186,2.648 2.648,2.648 1.462,0 2.648,-1.186 2.648,-2.648 V 2.648 C 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(530.231,109.4797)">
                        <path
                            d="m 0,0 h -21.056 c -1.463,0 -2.648,1.186 -2.648,2.648 0,1.462 1.185,2.648 2.648,2.648 H 0 C 1.462,5.296 2.648,4.11 2.648,2.648 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(323.9362,88.4237)">
                        <path
                            d="m 0,0 c -1.462,0 -2.648,1.186 -2.648,2.648 v 21.056 c 0,1.462 1.186,2.648 2.648,2.648 1.462,0 2.648,-1.186 2.648,-2.648 V 2.648 C 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(334.464,109.4797)">
                        <path
                            d="m 0,0 h -21.056 c -1.462,0 -2.648,1.186 -2.648,2.648 0,1.462 1.186,2.648 2.648,2.648 H 0 C 1.462,5.296 2.648,4.11 2.648,2.648 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(458.2416,88.4237)">
                        <path
                            d="m 0,0 c -1.462,0 -2.648,1.186 -2.648,2.648 v 21.056 c 0,1.462 1.186,2.648 2.648,2.648 1.462,0 2.648,-1.186 2.648,-2.648 V 2.648 C 2.648,1.186 1.462,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(472.9735,98.9518)">
                        <path
                            d="m 0,0 h -14.732 c -1.462,0 -2.648,1.186 -2.648,2.648 0,1.462 1.186,2.648 2.648,2.648 H 0 c 2.57,0 4.936,1.398 6.177,3.648 l 3.037,5.51 c 0.705,1.28 2.315,1.747 3.597,1.041 1.281,-0.706 1.747,-2.317 1.041,-3.598 L 10.815,6.388 C 8.644,2.448 4.499,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                    <g
                        transform="translate(485.5687,88.4231)">
                        <path
                            d="m 0,0 c -0.934,0 -1.839,0.495 -2.321,1.37 l -3.038,5.51 c -1.24,2.251 -3.607,3.649 -6.177,3.649 h -14.731 c -1.463,0 -2.648,1.185 -2.648,2.648 0,1.462 1.185,2.648 2.648,2.648 h 14.731 c 4.5,0 8.644,-2.448 10.815,-6.389 L 2.316,3.927 C 3.022,2.646 2.556,1.036 1.276,0.33 0.87,0.106 0.432,0 0,0"
                            style={{
                                fill: secondaryColor,
                                stroke: 'none'
                            }} />
                    </g>
                </g>
            </g>
        </g>
    </svg>
}