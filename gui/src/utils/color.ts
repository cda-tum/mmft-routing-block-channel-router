import seedrandom from 'seedrandom'

export function oklabsequence(index: number, lightness_steps: number[]) {
    const [min_a, max_a, min_b, max_b] = [-0.4, 0.4, -0.4, 0.4]
    const [range_a, range_b] = [max_a - min_a, max_b - min_b]

    let batch = 4
    let last_batch_size = 4
    let ab_round = -1
    let lightness_step = 0

    while (batch <= index) {
        lightness_step += 1
        if (lightness_step == lightness_steps.length) {
            lightness_step = 0
            ab_round += 1
        }
        if (ab_round == -1) {
            last_batch_size = 4
            batch += last_batch_size
        } else {
            last_batch_size = (2 ** ab_round) * 4
            batch += last_batch_size
        }
    }

    let a, b
    if (ab_round == -1) {
        const batch_index = index - batch + last_batch_size
        if (batch_index == 0) {
            a = min_a
            b = min_b
        } else if (batch_index == 1) {
            a = max_a
            b = min_b
        } else if (batch_index == 2) {
            a = max_a
            b = max_b
        } else if (batch_index == 3) {
            a = min_a
            b = max_b
        }
    } else {
        const batch_index = index - batch + last_batch_size
        const segments = 2 ** ab_round
        const segment_range_a = range_a / segments
        const segment_range_b = range_b / segments
        const side = batch_index % 4
        const segment_index = Math.floor(batch_index / 4)

        if (side == 0) {
            a = min_a + (segment_index + 0.5) * segment_range_a
            b = min_b
        } else if (side == 2) {
            a = max_a - (segment_index + 0.5) * segment_range_a
            b = max_b
        } else if (side == 1) {
            a = max_a
            b = min_b + (segment_index + 0.5) * segment_range_b
        } else if (side == 3) {
            a = min_a
            b = max_b - (segment_index + 0.5) * segment_range_b
        }
    }

    return [lightness_steps[lightness_step], a, b]
}

export function* oklabrandom(min_lightness: number, max_lightness: number, seed?: string) {
    let rng = seedrandom(seed ?? '')
    while (true) {
        const l = min_lightness + (max_lightness - min_lightness) * rng()
        const a = -0.4 + 0.8 * rng()
        const b = -0.4 + 0.8 * rng()
        yield [l, a, b]
    }
}