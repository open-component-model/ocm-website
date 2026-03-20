/** Kubernetes CRD YAML input types. */

/**
 * @typedef {Object} CrdDocument
 * @property {string}  apiVersion
 * @property {string}  kind
 * @property {Object}  metadata
 * @property {CrdSpec} spec
 */

/**
 * @typedef {Object} CrdSpec
 * @property {string}       group
 * @property {CrdNames}     names
 * @property {string}       [scope]
 * @property {CrdVersion[]} versions
 */

/**
 * @typedef {Object} CrdNames
 * @property {string}  kind
 * @property {string}  plural
 * @property {string}  singular
 * @property {string}  [listKind]
 */

/**
 * @typedef {Object} CrdVersion
 * @property {string}  name
 * @property {boolean} served
 * @property {boolean} storage
 * @property {{openAPIV3Schema?: Object}} [schema]
 */
