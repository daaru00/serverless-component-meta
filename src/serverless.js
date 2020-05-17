const { Component } = require('@serverless/core')
const {
  getServerlessSdk,
  findFiles,
  loadComponentFile,
  prepareInputs,
  arrayToObject,
  log,
  prepareComponentsList
} = require('./utils')

const slsConfig = {
  debug: true
}

class MetaComponent extends Component {
  /**
   * Deploy
   * @param {*} inputs
   */
  async deploy(inputs = {}) {
    // Serverless SDK
    const sdk = getServerlessSdk(inputs.accessKey || process.env.SERVERLESS_ACCESS_KEY, this.org)

    // Load components
    let components = prepareComponentsList(inputs)

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
    for (const componentName in components) {
      const component = components[componentName]
      // Deploy and also save parameters to future removing
      log(`Deploying component ${component.name}..`)
      const options = prepareInputs(component, inputs, this)
      deployPromises.push(
        sdk
          .deploy(options, this.credentials, slsConfig)
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
      const deployedServices = Object.keys(components)
      let componentsToRemove = Object.keys(this.state.outputs)
      componentsToRemove = componentsToRemove.filter(
        (componentName) => deployedServices.includes(componentName) === false
      )
      for (const componentName of componentsToRemove) {
        const component = this.state.outputs[componentName]
        log(`Removing component ${component.name}..`)
        removePromises.push(
          sdk
            .remove(
              {
                org: component.org || this.org,
                app: component.app || this.app,
                component: component.component || this.component,
                name: component.name,
                stage: component.stage || this.stage,
                inputs: component.inputs
              },
              this.credentials,
              slsConfig
            )
            .then(() => {
              log(`Component ${component.name} removed successfully!`)
            })
        )
      }
    }

    // Wait for all promises ends
    await Promise.all(removePromises)
    const instances = await Promise.all(deployPromises)

    // Update state
    this.state.outputs = this.state.outputs || {}
    for (const instance of instances) {
      this.state.outputs[instance.name] = instance
    }

    // Export outputs
    return this.state.outputs
  }

  /**
   * Remove
   * @param {*} inputs
   */
  async remove(inputs = {}) {
    let components = inputs.components || this.state.outputs
    if (!components) {
      throw new Error(`No components found. Components seems already removed`)
    }
    components = prepareComponentsList({ components })

    // Serverless SDK
    const sdk = getServerlessSdk(inputs.accessKey, this.org)

    // remove components
    for (const componentName in components) {
      const component = components[componentName]
      log(`Removing component ${component.name}..`)
      const removePromises = []
      removePromises.push(
        sdk
          .remove(
            {
              org: component.org || this.org,
              app: component.app || this.app,
              component: component.component || this.component,
              name: component.name,
              stage: component.stage || this.stage,
              inputs: component.inputs
            },
            this.credentials,
            slsConfig
          )
          .then(() => {
            log(`Component ${component.name} removed successfully!`)
          })
      )
    }

    this.state = {}
    return {}
  }
}

module.exports = MetaComponent
