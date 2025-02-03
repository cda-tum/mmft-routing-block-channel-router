use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap, HashSet, VecDeque};
use core::fmt::Debug;
use std::hash::Hash;

const INITIAL_PATH_CAPACITY: usize = 8;
const DEFAULT_HEURISTIC_BIAS: f64 = 1.0;

#[derive(PartialEq, Debug)]
pub struct Cost {
    estimate: f64,
    pub cost: f64,
    total: f64,
}

impl Eq for Cost {}

impl PartialOrd for Cost {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        other.total.partial_cmp(&self.total)
    }
}

impl Ord for Cost {
    fn cmp(&self, other: &Self) -> Ordering {
        self.partial_cmp(other).unwrap()
    }
}

#[derive(Eq, Debug)]
pub struct AStarNode<N: Eq + Copy + Debug> {
    pub node: N,
    pub cost: Cost,
    pub previous: Option<N>,
    prev_id: Option<usize>,
}

impl<N: Eq + Copy + Debug + Hash> Hash for AStarNode<N> {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.node.hash(state);
    }
}

impl<'a, N: Eq + Copy + Debug> PartialEq for AStarNode<N> {
    fn eq(&self, other: &Self) -> bool {
        self.node == other.node
    }
}

impl<'a, N: Eq + Copy + Debug> PartialOrd for AStarNode<N> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl<'a, N: Eq + Copy + Debug> Ord for AStarNode<N> {
    fn cmp(&self, other: &Self) -> Ordering {
        if self.cost > other.cost {
            Ordering::Greater
        } else if self.cost < other.cost {
            Ordering::Less
        } else {
            Ordering::Equal
        }
    }
}

pub fn a_star<N: Eq + Copy + Debug + Hash>(
    start: Vec<N>,
    heuristic: &dyn Fn(&N) -> f64,
    successors: &dyn Fn(&AStarNode<N>) -> Vec<(N, f64)>,
    is_target: &dyn Fn(&N) -> bool,
    heuristic_bias: Option<f64>
) -> Option<VecDeque<N>> {
    let mut open = BinaryHeap::<AStarNode<N>>::new();
    let bias = heuristic_bias.unwrap_or(DEFAULT_HEURISTIC_BIAS);
    let mut closed = HashMap::new(); // todo: replace with hashset if large enough
    start.into_iter().for_each(|n| {
        let h = heuristic(&n);
        open.push(AStarNode::<N> {
            node: n,
            cost: Cost {
                estimate: h,
                cost: 0.,
                total: h,
            },
            previous: None,
            prev_id: None,
        })
    });

    let mut target = None;

    while !open.is_empty() {
        let candidate = open.pop().unwrap();

        if is_target(&candidate.node) {
            target = Some(candidate);
            break;
        } else if closed.contains_key(&candidate.node) {
            continue;
        }

        let ns = successors(&candidate);
        let i = closed.len();
        ns.into_iter().for_each(|(n, c)| {
            let h = heuristic(&n);
            let nc = c + candidate.cost.cost;
            open.push(AStarNode::<N> {
                node: n,
                cost: Cost {
                    estimate: h,
                    cost: nc,
                    total: nc + h
                },
                previous: Some(candidate.node),
                prev_id: Some(i),
            })
        });
        closed.insert(candidate.node, candidate);
    }

    match target {
        Some(t) => {
            let mut path = VecDeque::with_capacity(INITIAL_PATH_CAPACITY);
            path.push_front(t.node);
            let mut node = &t;
            while node.previous.is_some() {
                node = &closed.get(&node.previous.unwrap()).unwrap();
                path.push_front(node.node);
            }
            Some(path)
        }
        None => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn dummy() {}

    mod a_star {
        use super::{a_star, AStarNode};

        mod graph_1 {
            use std::collections::VecDeque;

            use super::{a_star, AStarNode};

            type N = char;

            fn heuristic(n: &N) -> f64 {
                0.
            }

            fn successors(n: &AStarNode<N>) -> Vec<(N, f64)> {
                match n.node {
                    'A' => Vec::from([('B', 10.), ('C', 20.)]),
                    'B' => Vec::from([]),
                    'C' => Vec::from([('D', 10.)]),
                    'D' => Vec::from([]),
                    _ => panic!(),
                }
            }

            #[test]
            fn basic() {
                let start = Vec::from(['A']);
                fn is_target(n: &N) -> bool {
                    *n == 'D'
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, Some(VecDeque::from(['A', 'C', 'D'])))
            }

            #[test]
            fn unreachable_1() {
                let start = Vec::from(['B']);
                fn is_target(n: &N) -> bool {
                    *n == 'D'
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, None)
            }

            #[test]
            fn unreachable_2() {
                let start = Vec::from(['D']);
                fn is_target(n: &N) -> bool {
                    *n == 'B'
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, None)
            }

            #[test]
            fn unreachable_3() {
                let start = Vec::from(['C']);
                fn is_target(n: &N) -> bool {
                    *n == 'A'
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, None)
            }
        }

        mod graph_2 {
            use std::collections::VecDeque;

            use super::{a_star, AStarNode};

            type N = char;

            fn heuristic(n: &N) -> f64 {
                0.
            }

            fn successors(n: &AStarNode<N>) -> Vec<(N, f64)> {
                match n.node {
                    'A' => Vec::from([('B', 10.), ('C', 21.)]),
                    'B' => Vec::from([('D', 10.)]),
                    'C' => Vec::from([('D', 10.)]),
                    'D' => Vec::from([]),
                    _ => panic!(),
                }
            }

            #[test]
            fn basic() {
                let start = Vec::from(['A']);
                fn is_target(n: &N) -> bool {
                    *n == 'D'
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, Some(VecDeque::from(['A', 'B', 'D'])))
            }

            #[test]
            fn unreachable() {
                let start = Vec::from(['D']);
                fn is_target(n: &N) -> bool {
                    *n == 'A'
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, None)
            }
        }

        mod graph_3 {
            use std::collections::VecDeque;

            use super::{a_star, AStarNode};

            type N = char;

            #[test]
            fn heuristic_1() {
                let start = Vec::from(['A']);
                fn is_target(n: &N) -> bool {
                    *n == 'D'
                }
                fn heuristic(n: &N) -> f64 {
                    match n {
                        'A' => 20.,
                        'B' => 10.,
                        'C' => 5.,
                        'D' => 0.,
                        _ => panic!(),
                    }
                }
                fn successors(n: &AStarNode<N>) -> Vec<(N, f64)> {
                    match n.node {
                        'A' => Vec::from([('B', 10.), ('C', 12.)]),
                        'B' => Vec::from([('D', 10.)]),
                        'C' => Vec::from([('D', 10.)]),
                        'D' => Vec::from([]),
                        _ => panic!(),
                    }
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, Some(VecDeque::from(['A', 'B', 'D'])))
            }

            #[test]
            fn heuristic_2() {
                let start = Vec::from(['A']);
                fn is_target(n: &N) -> bool {
                    *n == 'D'
                }
                fn heuristic(n: &N) -> f64 {
                    match n {
                        'A' => 20.,
                        'B' => 5.,
                        'C' => 10.,
                        'D' => 0.,
                        _ => panic!(),
                    }
                }
                fn successors(n: &AStarNode<N>) -> Vec<(N, f64)> {
                    match n.node {
                        'A' => Vec::from([('B', 10.), ('C', 12.)]),
                        'B' => Vec::from([('D', 10.)]),
                        'C' => Vec::from([('D', 10.)]),
                        'D' => Vec::from([]),
                        _ => panic!(),
                    }
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, Some(VecDeque::from(['A', 'B', 'D'])))
            }

            #[test]
            fn cost_1() {
                let start = Vec::from(['A']);
                fn is_target(n: &N) -> bool {
                    *n == 'D'
                }
                fn heuristic(n: &N) -> f64 {
                    match n {
                        'A' => 20.,
                        'B' => 10.,
                        'C' => 5.,
                        'D' => 0.,
                        _ => panic!(),
                    }
                }
                fn successors(n: &AStarNode<N>) -> Vec<(N, f64)> {
                    match n.node {
                        'A' => Vec::from([('B', 14.), ('C', 12.)]),
                        'B' => Vec::from([('D', 10.)]),
                        'C' => Vec::from([('D', 10.)]),
                        'D' => Vec::from([]),
                        _ => panic!(),
                    }
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, Some(VecDeque::from(['A', 'C', 'D'])))
            }

            #[test]
            fn cost_2() {
                let start = Vec::from(['A']);
                fn is_target(n: &N) -> bool {
                    *n == 'D'
                }
                fn heuristic(n: &N) -> f64 {
                    match n {
                        'A' => 20.,
                        'B' => 5.,
                        'C' => 10.,
                        'D' => 0.,
                        _ => panic!(),
                    }
                }
                fn successors(n: &AStarNode<N>) -> Vec<(N, f64)> {
                    match n.node {
                        'A' => Vec::from([('B', 14.), ('C', 12.)]),
                        'B' => Vec::from([('D', 10.)]),
                        'C' => Vec::from([('D', 10.)]),
                        'D' => Vec::from([]),
                        _ => panic!(),
                    }
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, Some(VecDeque::from(['A', 'C', 'D'])))
            }
        }

        mod graph_4 {
            use core::f64;
            use std::collections::VecDeque;

            use super::{a_star, AStarNode};

            type N = i64;

            #[test]
            fn base() {
                let start = Vec::from([3]);
                fn is_target(n: &N) -> bool {
                    *n == 22
                }
                fn heuristic(n: &N) -> f64 {
                    let x = *n % 5;
                    let y = *n / 5;
                    match n {
                        _ => f64::hypot((x - 22 % 5) as f64, (y - 22 / 5) as f64),
                    }
                }
                fn successors(n: &AStarNode<N>) -> Vec<(N, f64)> {
                    match n.node {
                        0 => Vec::from([(1, 1.), (5, 1.), (6, f64::consts::SQRT_2)]),
                        1 => Vec::from([(0, 1.), (2, 1.), (6, 1.), (7, f64::consts::SQRT_2), (5, f64::consts::SQRT_2)]),
                        2 => Vec::from([(1, 1.), (3, 1.), (7, 1.), (8, f64::consts::SQRT_2), (6, f64::consts::SQRT_2)]),
                        3 => Vec::from([(2, 1.), (4, 1.), (8, 1.), (9, f64::consts::SQRT_2), (7, f64::consts::SQRT_2)]),
                        4 => Vec::from([(3, 1.), (9, 1.), (8, f64::consts::SQRT_2)]),
                        5 => Vec::from([(6, 1.), (10, 1.), (11, f64::consts::SQRT_2)]),
                        6 => Vec::from([(5, 1.), (7, 1.), (11, 1.), (12, f64::consts::SQRT_2), (10, f64::consts::SQRT_2)]),
                        7 => Vec::from([(6, 1.), (8, 1.), (12, 1.), (13, f64::consts::SQRT_2), (11, f64::consts::SQRT_2)]),
                        8 => Vec::from([(7, 1.), (9, 1.), (13, 1.), (14, f64::consts::SQRT_2), (12, f64::consts::SQRT_2)]),
                        9 => Vec::from([(8, 1.), (14, 1.), (13, f64::consts::SQRT_2)]),
                        10 => Vec::from([(11, 1.), (15, 1.), (16, f64::consts::SQRT_2)]),
                        11 => Vec::from([(10, 1.), (12, 1.), (16, 1.), (17, f64::consts::SQRT_2), (15, f64::consts::SQRT_2)]),
                        12 => Vec::from([(11, 1.), (13, 1.), (17, 1.), (18, f64::consts::SQRT_2), (16, f64::consts::SQRT_2)]),
                        13 => Vec::from([(12, 1.), (14, 1.), (18, 1.), (19, f64::consts::SQRT_2), (17, f64::consts::SQRT_2)]),
                        14 => Vec::from([(13, 1.), (19, 1.), (18, f64::consts::SQRT_2)]),
                        15 => Vec::from([(16, 1.), (20, 1.), (21, f64::consts::SQRT_2)]),
                        16 => Vec::from([(15, 1.), (17, 1.), (21, 1.), (22, f64::consts::SQRT_2), (20, f64::consts::SQRT_2)]),
                        17 => Vec::from([(16, 1.), (18, 1.), (22, 1.), (23, f64::consts::SQRT_2), (21, f64::consts::SQRT_2)]),
                        18 => Vec::from([(17, 1.), (19, 1.), (23, 1.), (24, f64::consts::SQRT_2), (22, f64::consts::SQRT_2)]),
                        19 => Vec::from([(18, 1.), (24, 1.), (23, f64::consts::SQRT_2)]),
                        20 => Vec::from([(21, 1.)]),
                        21 => Vec::from([(20, 1.), (22, 1.)]),
                        22 => Vec::from([(21, 1.), (23, 1.), ]),
                        23 => Vec::from([(22, 1.), (24, 1.), ]),
                        24 => Vec::from([(23, 1.)]),
                        _ => panic!(),
                    }
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, Some(VecDeque::from([3, 8, 13, 18, 22])))
            }

            #[test]
            fn base_2() {
                let start = Vec::from([3]);
                fn is_target(n: &N) -> bool {
                    *n == 22
                }
                fn heuristic(n: &N) -> f64 {
                    let x = *n % 5;
                    let y = *n / 5;
                    match n {
                        _ => f64::hypot((x - 22 % 5) as f64, (y - 22 / 5) as f64),
                    }
                }
                fn successors(n: &AStarNode<N>) -> Vec<(N, f64)> {
                    match n.node {
                        0 => Vec::from([(1, 1.), (5, 1.), (6, f64::consts::SQRT_2)]),
                        1 => Vec::from([(0, 1.), (2, 1.), (6, 1.), (7, f64::consts::SQRT_2), (5, f64::consts::SQRT_2)]),
                        2 => Vec::from([(1, 1.), (3, 1.), (7, 1.), (8, f64::consts::SQRT_2), (6, f64::consts::SQRT_2)]),
                        3 => Vec::from([(2, 1.), (4, 1.), (8, 1.), (9, f64::consts::SQRT_2), (7, f64::consts::SQRT_2)]),
                        4 => Vec::from([(3, 1.), (9, 1.), (8, f64::consts::SQRT_2)]),
                        5 => Vec::from([(6, 1.), (10, 1.), (11, f64::consts::SQRT_2)]),
                        6 => Vec::from([(5, 1.), (7, 1.), (11, 1.), (12, f64::consts::SQRT_2), (10, f64::consts::SQRT_2)]),
                        7 => Vec::from([(6, 1.), (8, 1.), (12, 1.), (13, f64::consts::SQRT_2), (11, f64::consts::SQRT_2)]),
                        8 => Vec::from([(7, 1.), (9, 1.), (14, f64::consts::SQRT_2), (12, f64::consts::SQRT_2)]),
                        9 => Vec::from([(8, 1.), (14, 1.), (13, f64::consts::SQRT_2)]),
                        10 => Vec::from([(11, 1.), (15, 1.), (16, f64::consts::SQRT_2)]),
                        11 => Vec::from([(10, 1.), (12, 1.), (16, 1.), (17, f64::consts::SQRT_2), (15, f64::consts::SQRT_2)]),
                        12 => Vec::from([(11, 1.), (13, 1.), (17, 1.), (18, f64::consts::SQRT_2), (16, f64::consts::SQRT_2)]),
                        13 => Vec::from([(12, 1.), (14, 1.), (18, 1.), (19, f64::consts::SQRT_2), (17, f64::consts::SQRT_2)]),
                        14 => Vec::from([(13, 1.), (19, 1.), (18, f64::consts::SQRT_2)]),
                        15 => Vec::from([(16, 1.), (20, 1.), (21, f64::consts::SQRT_2)]),
                        16 => Vec::from([(15, 1.), (17, 1.), (21, 1.), (22, f64::consts::SQRT_2), (20, f64::consts::SQRT_2)]),
                        17 => Vec::from([(16, 1.), (18, 1.), (22, 1.), (23, f64::consts::SQRT_2), (21, f64::consts::SQRT_2)]),
                        18 => Vec::from([(17, 1.), (19, 1.), (23, 1.), (24, f64::consts::SQRT_2), (22, f64::consts::SQRT_2)]),
                        19 => Vec::from([(18, 1.), (24, 1.), (23, f64::consts::SQRT_2)]),
                        20 => Vec::from([(21, 1.)]),
                        21 => Vec::from([(20, 1.), (22, 1.)]),
                        22 => Vec::from([(21, 1.), (23, 1.), ]),
                        23 => Vec::from([(22, 1.), (24, 1.), ]),
                        24 => Vec::from([(23, 1.)]),
                        _ => panic!(),
                    }
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, Some(VecDeque::from([3, 8, 12, 17, 22])))
            }

            #[test]
            fn base_3() {
                let start = Vec::from([3]);
                fn is_target(n: &N) -> bool {
                    *n == 22
                }
                fn heuristic(n: &N) -> f64 {
                    let x = *n % 5;
                    let y = *n / 5;
                    match n {
                        _ => f64::hypot((x - 22 % 5) as f64, (y - 22 / 5) as f64),
                    }
                }
                fn successors(n: &AStarNode<N>) -> Vec<(N, f64)> {
                    match n.node {
                        0 => Vec::from([(1, 1.), (5, 1.), (6, f64::consts::SQRT_2)]),
                        1 => Vec::from([(0, 1.), (2, 1.), (6, 1.), (7, f64::consts::SQRT_2), (5, f64::consts::SQRT_2)]),
                        2 => Vec::from([(1, 1.), (3, 1.), (7, 1.), (8, f64::consts::SQRT_2), (6, f64::consts::SQRT_2)]),
                        3 => Vec::from([(2, 1.), (4, 1.), (8, 1.), (9, f64::consts::SQRT_2), (7, f64::consts::SQRT_2)]),
                        4 => Vec::from([(3, 1.), (9, 1.), (8, f64::consts::SQRT_2)]),
                        5 => Vec::from([(6, 1.), (10, 1.), (11, f64::consts::SQRT_2)]),
                        6 => Vec::from([(5, 1.), (7, 1.), (11, 1.), (12, f64::consts::SQRT_2), (10, f64::consts::SQRT_2)]),
                        7 => Vec::from([(6, 1.), (8, 1.), (12, 1.), (13, f64::consts::SQRT_2), (11, f64::consts::SQRT_2)]),
                        8 => Vec::from([(7, 1.), (9, 1.), (14, f64::consts::SQRT_2)]),
                        9 => Vec::from([(8, 1.), (14, 1.), (13, f64::consts::SQRT_2)]),
                        10 => Vec::from([(11, 1.), (15, 1.), (16, f64::consts::SQRT_2)]),
                        11 => Vec::from([(10, 1.), (12, 1.), (16, 1.), (17, f64::consts::SQRT_2), (15, f64::consts::SQRT_2)]),
                        12 => Vec::from([(11, 1.), (13, 1.), (17, 1.), (18, f64::consts::SQRT_2), (16, f64::consts::SQRT_2)]),
                        13 => Vec::from([(12, 1.), (14, 1.), (18, 1.), (19, f64::consts::SQRT_2), (17, f64::consts::SQRT_2)]),
                        14 => Vec::from([(13, 1.), (19, 1.), (18, f64::consts::SQRT_2)]),
                        15 => Vec::from([(16, 1.), (20, 1.), (21, f64::consts::SQRT_2)]),
                        16 => Vec::from([(15, 1.), (17, 1.), (21, 1.), (22, f64::consts::SQRT_2), (20, f64::consts::SQRT_2)]),
                        17 => Vec::from([(16, 1.), (18, 1.), (22, 1.), (23, f64::consts::SQRT_2), (21, f64::consts::SQRT_2)]),
                        18 => Vec::from([(17, 1.), (19, 1.), (23, 1.), (24, f64::consts::SQRT_2), (22, f64::consts::SQRT_2)]),
                        19 => Vec::from([(18, 1.), (24, 1.), (23, f64::consts::SQRT_2)]),
                        20 => Vec::from([(21, 1.)]),
                        21 => Vec::from([(20, 1.), (22, 1.)]),
                        22 => Vec::from([(21, 1.), (23, 1.), ]),
                        23 => Vec::from([(22, 1.), (24, 1.), ]),
                        24 => Vec::from([(23, 1.)]),
                        _ => panic!(),
                    }
                }
                let result = a_star(start, &heuristic, &successors, &is_target, None);
                assert_eq!(result, Some(VecDeque::from([3, 7, 12, 17, 22])))
            }
        }
    }
}
