class StringUtil {
    /**
     * String utilities.
     */
    constructor() {}

    /**
     * It... capitalizes a string. Anything that's not the first character becomes lowercase.
     * @param str {string} - The string to capitalize.
     * @return {string}
     */
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
}

module.exports = StringUtil;