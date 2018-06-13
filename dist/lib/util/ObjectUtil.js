const StringUtil = require('./StringUtil');

class ObjectUtil {
   /**
    * Converts underscored properties into camelCase JS ones using a cloned object.
    * This method does not take circular references into account since they should not exist in slack's responses
    * (which this method was originally designed for).
    * @example
    * // Returns {helloWorld: 'hi'}
    * ObjectUtil.convertProperties({
    *  hello_world: 'hi!'
    * });
    * @param obj {object} - The object to convert.
    * @param {boolean} [deep=true] - Whether the conversion should be deep, i.e. if it should enter further objects to convert their properties.
    * @returns {object}
    */
   static convertProperties(obj, deep = true) {
      let newObj = {};

      // noinspection EqualityComparisonWithCoercionJS
      if (obj == null || !obj) {
         return obj;
      }

      for (const prop of Object.keys(obj)) {
         const bits = prop.split('_');

         if (bits.length === 0) {
            newObj[prop] = obj[prop];
            continue;
         }

         for (let i = 1; i < bits.length; i++) {
            const bit = bits[i];

            bits[i] = bit.length === 1 ? bit : StringUtil.capitalize(bit);
         }

         const newProp = bits.join('');

         const val = obj[prop];

         newObj[newProp] = typeof val === 'object' && deep ? ObjectUtil.convertProperties(val) : val;
      }

      return newObj;
   }

   static assignGiven(destination, source, props) {
      for (const prop of props) {
         destination[prop] = source[prop];
      }
   }
}

module.exports = ObjectUtil;