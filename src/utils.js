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
    if (currentValue.name) {
      previousValue[currentValue.name] = currentValue
    }
    if (typeof currentValue === 'string') {
      previousValue[currentValue] = {
        name: currentValue
      }
    }
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
  inputs.globals.region = inputs.globals.region || instance.region

  return {
    org: component.org || inputs.globals.org || instance.org,
    app: component.app || inputs.globals.app || instance.app,
    component: component.component || inputs.globals.component,
    name: component.name,
    stage: component.stage || inputs.globals.stage || instance.stage,
    inputs: Object.assign({}, inputs.globals, component.inputs, {
      // also add globalInputs property, in case component is injected recursively
      globals: inputs.globals
    })
  }
}

/**
 * Prepare components list
 * @param {object} inputs
 */
const prepareComponentsList = (inputs) => {
  let { components } = inputs
  if (Array.isArray(components)) {
    components = arrayToObject(components)
  } else if (typeof components === 'object') {
    // set components names
    for (const componentName in components) {
      // if not already set
      if (components[componentName] && !components[componentName].name) {
        components[componentName].name = componentName
      }
    }
  } else {
    throw new Error(`Cannot parse "components" inputs.`)
  }
  return components
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
  prepareInputs,
  prepareComponentsList
}
