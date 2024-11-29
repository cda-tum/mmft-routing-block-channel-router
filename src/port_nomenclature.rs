use std::ops::Index;

use regex::Regex;

const PORT_PATTERN: &str = r"^(?<y>[a-zA-Z]+)(?<x>[1-9][0-9]*)$";
const ALPHABET_N: usize = 26;
const ALPHABET: [char; ALPHABET_N] = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
    'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

pub fn port_identifier_to_index(maybe_port_identifier: &str) -> Option<(usize, usize)> {
    match match_port_identifier(maybe_port_identifier) {
        Some((x, y)) => {
            let maybe_x_index = x.parse::<usize>();
            let maybe_y_index = alphabet_to_usize(y.to_uppercase().as_str());
            match (maybe_x_index, maybe_y_index) {
                (Ok(x_index), Some(y_index)) => Some((x_index.checked_sub(1)?, y_index)),
                _ => None,
            }
        }
        None => None,
    }
}

pub fn port_index_to_identifier(port_index: (usize, usize)) -> String {
    format!("{}{}", usize_to_alphabet(port_index.1), port_index.0 + 1)
}

pub fn match_port_identifier(maybe_port_identifier: &str) -> Option<(&str, &str)> {
    let regex = Regex::new(PORT_PATTERN).unwrap();
    let ports: Vec<(&str, &str)> = regex
        .captures_iter(maybe_port_identifier)
        .map(|cap| {
            (
                cap.name("x").unwrap().as_str(),
                cap.name("y").unwrap().as_str(),
            )
        })
        .collect();
    if ports.len() != 1 {
        None
    } else {
        Some(ports[0])
    }
}

fn alphabet_to_usize(alphabet: &str) -> Option<usize> {
    Some(
        alphabet
            .chars()
            .into_iter()
            .map(|c| ALPHABET.iter().position(|a| *a == c))
            .try_fold(0, |n, i| Some(n * ALPHABET_N + i? + 1))?
            .checked_sub(1)?,
    )
}

fn usize_to_alphabet(mut index: usize) -> String {
    let mut chars: Vec<char> = Vec::new();
    loop {
        let rem = index % ALPHABET_N;
        chars.push(ALPHABET[rem]);
        let Some(next) = (index / 26).checked_sub(1) else {
            break;
        };
        index = next;
    }

    chars.into_iter().rev().collect()
}

#[cfg(test)]
mod tests {

    mod port_identifier_to_index {
        use crate::port_nomenclature::port_identifier_to_index;

        #[test]
        fn test_1() {
            assert_eq!(port_identifier_to_index("A1"), Some((0, 0)))
        }

        #[test]
        fn test_2() {
            assert_eq!(port_identifier_to_index("B1"), Some((0, 1)))
        }

        #[test]
        fn test_3() {
            assert_eq!(port_identifier_to_index("A2"), Some((1, 0)))
        }

        #[test]
        fn test_4() {
            assert_eq!(port_identifier_to_index("C4"), Some((3, 2)))
        }

        #[test]
        fn test_5() {
            assert_eq!(port_identifier_to_index("F8"), Some((7, 5)))
        }

        #[test]
        fn test_6() {
            assert_eq!(port_identifier_to_index(""), None)
        }

        #[test]
        fn test_7() {
            assert_eq!(port_identifier_to_index("invalid"), None)
        }

        #[test]
        fn test_8() {
            assert_eq!(port_identifier_to_index("0A1"), None)
        }

        #[test]
        fn test_10() {
            assert_eq!(port_identifier_to_index("a1"), Some((0, 0)))
        }

        #[test]
        fn test_11() {
            assert_eq!(port_identifier_to_index("12"), None)
        }

        #[test]
        fn test_12() {
            assert_eq!(port_identifier_to_index("A"), None)
        }
    }

    mod port_index_to_identifier {
        use crate::port_nomenclature::port_index_to_identifier;

        #[test]
        fn test_1() {
            assert_eq!(port_index_to_identifier((0, 0)), "A1")
        }

        #[test]
        fn test_2() {
            assert_eq!(port_index_to_identifier((0, 1)), "B1")
        }

        #[test]
        fn test_3() {
            assert_eq!(port_index_to_identifier((1, 0)), "A2")
        }

        #[test]
        fn test_4() {
            assert_eq!(port_index_to_identifier((3, 2)), "C4")
        }

        #[test]
        fn test_5() {
            assert_eq!(port_index_to_identifier((7, 5)), "F8")
        }
    }

    mod alphabet_to_usize {
        use std::iter;

        use crate::port_nomenclature::{alphabet_to_usize, ALPHABET};

        #[test]
        fn test_1() {
            assert_eq!(alphabet_to_usize("test"), None)
        }

        #[test]
        fn test_2() {
            assert_eq!(alphabet_to_usize(""), None)
        }

        #[test]
        fn test_3() {
            assert_eq!(alphabet_to_usize("1"), None)
        }

        #[test]
        fn test_4() {
            assert_eq!(alphabet_to_usize("Ö"), None)
        }

        #[test]
        fn test_5() {
            assert_eq!(alphabet_to_usize("A"), Some(0))
        }

        #[test]
        fn test_6() {
            assert_eq!(alphabet_to_usize("B"), Some(1))
        }

        #[test]
        fn test_7() {
            assert_eq!(alphabet_to_usize("Z"), Some(25))
        }

        #[test]
        fn test_8() {
            assert_eq!(alphabet_to_usize("AA"), Some(26))
        }

        #[test]
        fn test_9() {
            assert_eq!(alphabet_to_usize("AB"), Some(27))
        }

        #[test]
        fn test_10() {
            assert_eq!(alphabet_to_usize("AZ"), Some(51))
        }

        #[test]
        fn test_11() {
            assert_eq!(alphabet_to_usize("a"), None)
        }

        #[test]
        fn test_12() {
            assert_eq!(alphabet_to_usize("BA"), Some(52))
        }

        #[test]
        fn test_13() {
            let alphabet_options: Vec<Option<char>> = iter::once(None)
                .chain(ALPHABET.iter().map(|&l| Some(l)))
                .collect();
            let mut count = 0;
            for (((e3, e2), e1), e0) in alphabet_options
                .iter()
                .flat_map(|e| iter::repeat(e).zip(alphabet_options.iter()))
                .flat_map(|e| iter::repeat(e).zip(alphabet_options.iter()))
                .flat_map(|e| iter::repeat(e).zip(ALPHABET.into_iter()))
            {
                let mut chars = Vec::from([e0]);
                if e1.is_some() {
                    chars.push(e1.unwrap());
                    if e2.is_some() {
                        chars.push(e2.unwrap());
                        if e3.is_some() {
                            chars.push(e3.unwrap());
                        }
                    } else {
                        if e3.is_some() {
                            continue;
                        }
                    }
                } else {
                    if e2.is_some() || e3.is_some() {
                        continue;
                    }
                }
                let id: String = chars.into_iter().rev().collect();
                assert_eq!(alphabet_to_usize(&id), Some(count));
                count += 1;
            }
        }
    }

    mod usize_to_alphabet {
        use std::iter;

        use crate::port_nomenclature::{usize_to_alphabet, ALPHABET};

        #[test]
        fn test_1() {
            assert_eq!(usize_to_alphabet(0), "A")
        }

        #[test]
        fn test_2() {
            assert_eq!(usize_to_alphabet(1), "B")
        }

        #[test]
        fn test_3() {
            assert_eq!(usize_to_alphabet(25), "Z")
        }

        #[test]
        fn test_4() {
            assert_eq!(usize_to_alphabet(26), "AA")
        }

        #[test]
        fn test_5() {
            assert_eq!(usize_to_alphabet(51), "AZ")
        }

        #[test]
        fn test_6() {
            assert_eq!(usize_to_alphabet(52), "BA")
        }

        #[test]
        fn test_7() {
            assert_eq!(usize_to_alphabet(77), "BZ")
        }

        #[test]
        fn test_8() {
            let alphabet_options: Vec<Option<char>> = iter::once(None)
                .chain(ALPHABET.iter().map(|&l| Some(l)))
                .collect();
            let mut count = 0;
            for (((e3, e2), e1), e0) in alphabet_options
                .iter()
                .flat_map(|e| iter::repeat(e).zip(alphabet_options.iter()))
                .flat_map(|e| iter::repeat(e).zip(alphabet_options.iter()))
                .flat_map(|e| iter::repeat(e).zip(ALPHABET.into_iter()))
            {
                let mut chars = Vec::from([e0]);
                if e1.is_some() {
                    chars.push(e1.unwrap());
                    if e2.is_some() {
                        chars.push(e2.unwrap());
                        if e3.is_some() {
                            chars.push(e3.unwrap());
                        }
                    } else {
                        if e3.is_some() {
                            continue;
                        }
                    }
                } else {
                    if e2.is_some() || e3.is_some() {
                        continue;
                    }
                }
                let id: String = chars.into_iter().rev().collect();
                assert_eq!(usize_to_alphabet(count), id);
                count += 1;
            }
        }
    }
}

/*

export function fromAlphabetCol(col: string) {
    const upperCaseCol = col.toUpperCase()
    return [...upperCaseCol]
        .map((ch) => upperCaseAlphabet.indexOf(ch))
        .reduce((n, i) => n * 26 + i + 1, 0) - 1
}

export function toAlphabetCol(n: number) {
    const chars = []

    let d
    while (n >= 0) {
        ;[n, d] = [Math.floor(n / 26) - 1, n % 26]
        chars.unshift(upperCaseAlphabet[d])
    }
    return chars.join('')
}

export function portStringToIndex(port: string): [number, number] | undefined {
    const r = port.match(PORT_PATTERN)
    if (r === undefined || r === null) {
        return undefined
    }
    const yString = r[1]
    const xString = r[2]
    const x = parseInt(xString) - 1
    const y = fromAlphabetCol(yString)
    return [x, y]
}

export function portIndexToString(port: [number, number]) {
    return `${toAlphabetCol(port[1])}${port[0] + 1}`
}

export const upperCaseAlphabet = [...Array(26).keys()].map((_, i) => String.fromCodePoint(i + 'A'.codePointAt(0)!))

*/
