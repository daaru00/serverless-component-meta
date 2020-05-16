const { merge, endsWith } = require('ramda')
const fse = require('fs-extra')
const traverse = require('traverse')
const YAML = require('js-yaml')

/**
 * These are imported from https://github.com/serverless/components/blob/master/src/cli/utils.js
 * cannot import package @serverless/components directly because of huge size (~95MB)
 */

/**
 * Checks if a file exists
 * @param {*} filePath
 */
const fileExistsSync = (filePath) => {
  try {
    const stats = fse.lstatSync(filePath)
    return stats.isFile()
  } catch (e) {
    return false
  }
}

/**
 * Determines if a given file path is a YAML file
 * @param {*} filePath
 */
const isYamlPath = (filePath) => endsWith('.yml', filePath) || endsWith('.yaml', filePath)

/**
 * Determines if a given file path is a JSON file
 * @param {*} filePath
 */
const isJsonPath = (filePath) => endsWith('.json', filePath)

/**
 * Reads a file on the file system
 * @param {*} filePath
 * @param {*} options
 */
const readFileSync = (filePath, options = {}) => {
  if (!fileExistsSync(filePath)) {
    throw new Error(`File does not exist at this path ${filePath}`)
  }

  const contents = fse.readFileSync(filePath, 'utf8')
  if (isJsonPath(filePath)) {
    return JSON.parse(contents)
  } else if (isYamlPath(filePath)) {
    return YAML.load(contents.toString(), merge(options, { filename: filePath }))
  } else if (filePath.endsWith('.slsignore')) {
    return contents.toString().split('\n')
  }
  return contents.toString().trim()
}

/**
 * Resolves any variables that require resolving before the engine.
 * This currently supports only ${env}.  All others should be resolved within the deployment engine.
 * @param {*} inputs
 */
const resolveVariables = (inputs) => {
  const regex = /\${(\w*:?[\w\d.-]+)}/g
  let variableResolved = false
  const resolvedInputs = traverse(inputs).forEach(function(value) {
    const matches = typeof value === 'string' ? value.match(regex) : null
    if (matches) {
      let newValue = value
      for (const match of matches) {
        // Search for ${env:}
        if (/\${env:(\w*[\w.-_]+)}/g.test(match)) {
          const referencedPropertyPath = match.substring(2, match.length - 1).split(':')
          newValue = process.env[referencedPropertyPath[1]]
          variableResolved = true
          if (match === value) {
            newValue = process.env[referencedPropertyPath[1]]
          } else {
            newValue = value.replace(match, process.env[referencedPropertyPath[1]])
          }
        }
      }
      this.update(newValue)
    }
  })
  if (variableResolved) {
    return resolveVariables(resolvedInputs)
  }
  return resolvedInputs
}

/**
 * Exports
 */
module.exports = {
  fileExistsSync,
  readFileSync,
  resolveVariables
}
