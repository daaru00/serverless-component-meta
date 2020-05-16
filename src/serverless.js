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
    let { components } = inputs
    if (Array.isArray(inputs.components)) {
      components = arrayToObject(inputs.components)
    } else if (typeof inputs.components === 'object') {
      // set components names
      for (const componentName in inputs.components) {
        // if not already set
        if (components[componentName] && !components[componentName].name) {
          components[componentName].name = componentName
        }
      }
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

    log(components)

    // Deploy components
    const deployPromises = []
    for (const componentName in components) {
      const component = components[componentName]
      // Deploy and also save parameters to future removing
      log(`Deploying component ${component.name}..`)
      const options = prepareInputs(component, inputs, this)
      deployPromises.push(
        sdk
          .deploy(options)
          .then((response) => {
            log(`Component ${component.name} deployed successfully!`)
            return response
          })
          .then((response) => Object.assign(response, options))
      )
    }

    // Remove components
    const removePromises = []
    if (this.state.outputs && Object.keys(this.state.outputs).length > 0) {
      const componentsToRemove = Object.keys(this.state.outputs).filter(
        (output) => Object.keys(components).includes(output.name) === false
      )
      for (const componentName of componentsToRemove) {
        const component = componentsToRemove[componentName]
        log(`Removing component ${componentName}..`)
        removePromises.push(
          sdk
            .remove({
              org: component.org || this.org,
              app: component.app || this.app,
              component: component.component || this.component,
              name: component.name,
              stage: component.stage || this.stage,
              inputs: component.inputs
            })
            .then(() => {
              log(`Component ${component.name} removed successfully!`)
            })
        )
      }
    }

    // Wait for all promises ends
    await Promise.all(removePromises)
    const instances = await Promise.all(deployPromises)

    log(instances)

    // Update state
    for (const instance of instances) {
      this.state.outputs[instance.outputs.name] = instance.outputs
    }

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
          .remove({
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
