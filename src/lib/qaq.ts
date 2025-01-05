import { getRandomQAQ } from "qaq-font"

export const Sadness = (text: string) => {
    return `${text} ${getRandomQAQ('sadness', 1)[0]}`
}

export const Happy = (text: string) => {
    return `${text} ${getRandomQAQ('happy', 1)[0]}`
}