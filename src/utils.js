const glob = require('glob-all')
const { ServerlessSDK } = require('@serverless/platform-client')
const { fileExistsSync, readFileSync, resolveVariables } = require('imported-utils.js')

/**
 * Console log replacement
 * @param {*} msg
 */
const log = (msg) => console.log(msg) // eslint-disable-line

/**
 * Console error replacement
 * @param {*} msg
 */
const logError = (msg) => console.error(msg) // eslint-disable-line

/**
 * Console error replacement
 * @param {*} msg
 */
const arrayToObject = (array, obj = {}) => {
  return array.reduce((previousValue, currentValue) => {
    if (!currentValue || !currentValue.name) {
      return previousValue
    }
    previousValue[currentValue.name] = currentValue
    return previousValue
  }, obj)
}

/**
 * Initializes and returns an instance of the serverless sdk
 * @param {string} accessKey - the serverless access key
 * @param {string} orgName - the serverless org name. Must correspond to the access key in the env
 */
const getServerlessSdk = (accessKey, orgName) => {
  const sdk = new ServerlessSDK({
    accessKey: accessKey || process.env.SERVERLESS_ACCESS_KEY,
    context: {
      orgName: orgName || process.env.SERVERLESS_ORG
    }
  })
  return sdk
}

/**
 * Find file using pattern
 * @param {string} baseDir
 * @param {string[]} patterns
 */
const findFiles = (baseDir, patterns) => {
  const options = {
    root: baseDir
  }
  return glob.sync(patterns, options)
}

/**
 * Load component file
 * @param {string} file
 * @returns {object}
 */
const loadComponentFile = (file) => {
  if (!fileExistsSync(file)) {
    throw new Error(`File ${file} does not exist`)
  }
  let content = readFileSync(file)
  content = resolveVariables(content)
  if (!content.name) {
    throw new Error(`Component file ${file} has no "name" property.`)
  }
  if (!content.component) {
    throw new Error(`Component file ${file} has no "component" property.`)
  }
  return {
    component: content.component,
    name: content.name,
    org: content.org,
    app: content.app,
    stage: content.stage,
    inputs: content.inputs
  }
}

/**
 * Prepare inputs
 * @param {object} component
 * @param {object} inputs
 * @param {object} instance
 */
const prepareInputs = (component, inputs, instance) => {
  inputs.globals = inputs.globals || {}

  return {
    org: component.org || instance.org,
    app: component.app || instance.app,
    component: component.component,
    name: component.name,
    stage: component.stage || instance.stage,
    inputs: Object.assign({}, inputs.globals, component.inputs, {
      // also add globalInputs property, in case component is injected recursively
      globals: inputs.globals
    })
  }
}

/**
 * Exports
 */
module.exports = {
  log,
  logError,
  arrayToObject,
  getServerlessSdk,
  findFiles,
  loadComponentFile,
  prepareInputs
}
