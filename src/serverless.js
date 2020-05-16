const { Component } = require('@serverless/core')
const {
  getServerlessSdk,
  findFiles,
  loadComponentFile,
  prepareInputs,
  arrayToObject,
  log,
  logError
} = require('./utils')

class AwsSSMDocument extends Component {
  /**
   * Deploy
   * @param {*} inputs
   */
  async deploy(inputs = {}) {
    // Serverless deploy
    const sdk = getServerlessSdk(inputs.accessKey, this.org)

    // Load components
    let components = {}
    if (Array.isArray(inputs.components)) {
      components = arrayToObject(inputs.components)
    } else if (typeof inputs.components === 'object') {
    } else {
      throw new Error(`Cannot parse "components" inputs.`)
    }

    // Automatically find components files
    if (inputs.autoDiscovery) {
      if (typeof inputs.autoDiscovery == 'string') {
        inputs.autoDiscovery = [inputs.autoDiscovery]
      }
      const files = await findFiles(inputs.src, inputs.autoDiscovery)
      components = arrayToObject(files.map(loadComponentFile), components)
    }

    // Deploy components
    const deployPromises = []
    for (const component of components) {
      // Deploy and also save parameters to future removing
      log(`Deploying component ${component}..`)
      const options = prepareInputs(component, this)
      deployPromises.push(
        sdk
          .deploy(options)
          .then((response) => {
            log(`Component ${component} deployed successfully!`)
            return response
          })
          .then((response) => Object.assign(response, options))
          .catch((err) => {
            logError(`Error during component ${component} deploy: ${err.message}`)
          })
      )
    }

    // Remove components
    const removePromises = []
    if (this.state.outputs && Array.isArray(this.state.outputs) && this.state.outputs.length > 0) {
      const componentsToRemove = this.state.outputs.filter(
        (output) => Object.values(components).includes(output.name) === false
      )
      for (const component of componentsToRemove) {
        log(`Removing component ${component}..`)
        removePromises.push(
          sdk
            .deploy({
              org: component.org || this.org,
              app: component.app || this.app,
              component: component.component || this.component,
              name: component.name,
              stage: component.stage || this.stage,
              inputs: component.inputs
            })
            .then(() => {
              log(`Component ${component} deployed successfully!`)
            })
            .catch((err) => {
              logError(`Error during component ${component} remove: ${err.message}`)
            })
        )
      }
    }

    // Wait for all promises ends
    await Promise.all(removePromises)
    const outputs = await Promise.all(deployPromises)

    // Update state
    this.state.outputs = arrayToObject(outputs)

    // Export outputs
    return this.state.outputs
  }

  /**
   * Remove
   * @param {*} inputs
   */
  async remove(inputs = {}) {
    const components = inputs.components || this.state.outputs
    if (!components) {
      throw new Error(`No components found. Components appears removed already`)
    }

    // Serverless deploy
    const sdk = getServerlessSdk(inputs.accessKey, this.org)

    // remove components
    for (const component of components) {
      log(`Removing component ${component}..`)
      const removePromises = []
      removePromises.push(
        sdk
          .deploy({
            org: component.org || this.org,
            app: component.app || this.app,
            component: component.component || this.component,
            name: component.name,
            stage: component.stage || this.stage,
            inputs: component.inputs
          })
          .then(() => {
            log(`Component ${component} deployed successfully!`)
          })
          .catch((err) => {
            logError(`Error during component ${component} remove: ${err.message}`)
          })
      )
    }

    this.state = {}
    return {}
  }
}

module.exports = AwsSSMDocument
