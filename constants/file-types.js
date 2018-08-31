const _ = require('lodash');

const TYPES = [
  {
    type: 'controller',
    singular: false,
  },
  {
    type: 'model',
    singular: true,
  },
  {
    type: 'adapter',
    singular: true,
  },
  {
    type: 'serializer',
    singular: true,
  },
  {
    type: 'helper',
    singular: false,
  },
  {
    type: 'service',
    singular: false,
  },
  {
    type: 'route',
    singular: false,
  },
  {
    type: 'component',
    singular: false,
  },
  {
    type: 'mixin',
    singular: false,
  },
];
const typesObject = _.keyBy(TYPES, (obj) => {
  return obj.type.toUpperCase();
});
const validTypes = TYPES.map(t => t.type);
const singlularTypes = _.filter(TYPES, { 'singular': true }).map(t => t.type);

module.exports = {
  typesObject,
  validTypes,
  singlularTypes,
  TYPES,
};
