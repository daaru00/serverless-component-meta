# Meta Component 

This is a "meta component" that wrap other [Serverless Components](https://github.com/serverless/components) to deploy multiple components in one shot.

## Before Starting

This repository is not part of official [Serverless Components repository](https://github.com/serverless/components).
This is an experimental component built following "Building Components" section guide.

## Getting Started

For more information about Serverless Components follow [official guide](https://github.com/serverless/components).

### 1. Install

To get started with component, install the latest version of the Serverless Framework:

```
$ npm install -g serverless
```

### 2. Credentials

Create a new `.env` file in the root of the `aws-ssm-document` directory right next to `serverless.yml`, and add your AWS access keys:

```
# .env
AWS_ACCESS_KEY_ID=XXX
AWS_SECRET_ACCESS_KEY=XXX
```

### 3. Configure

Here's a complete reference of the `serverless.yml` file for the `aws-ssm-document` component:

```yml
# serverless.yml

component: meta                  # (required) name of the component. In that case, it's aws-ssm-document.
name: myCollection               # (required) name of your component instance.
org: daaru                       # (optional) serverless dashboard org. default is the first org you created during signup.
app: myApp                       # (optional) serverless dashboard app. default is the same as the name property.
stage: dev                       # (optional) serverless dashboard stage. default is dev.

inputs:
  accessKey: "${env:SERVERLESS_ACCESS_KEY}" # (optional) Serverless Access key used to deploy components
  region: us-east-1                         # (optional) aws region to deploy to. default is us-east-1.
  src: .                                    # (required) upload definition files
  autoDiscovery: './**/serverless.yml'      # (optional) find serverless components declaration files using file glob
  globalInputs:                             # (required)  global inputs will be merged into sub-components
    prop: value
  components:                 # (required) components list
    - component: aws-lambda
      name: my-lambda
      inputs:
        src: ./my-service/
        handler: index.handler
    - component: aws-lambda
      name: my-other-lambda
      inputs:
        src: ./my-other-service/
        handler: index.handler
```

Components can be also described as object, In this configuration the object key (`my-lambda`) will be used as component name.

```yml
# serverless.yml

#..

inputs:
  src: .
  components:
    my-lambda:
      component: aws-lambda
      inputs:
        src: ./my-service/
        handler: index.handler

    my-lambda2:
      component: aws-lambda
      name: 'my-other-lambda'    # (optional) name can be also override
      inputs:
        src: ./my-other-service/
        handler: index.handler
```

Components files can be discovered using multiple glob patterns:

```yml
# serverless.yml

#..

inputs:
  src: .
  autoDiscovery: 
    - 'components/**/serverless.yml'       # include all files in a directory
    - '!components/not/**/serverless.yml'  # then, exclude a sub directory
    - 'components/not/serverless.yml'      # then, re-include a single file
```

Note that you can also use an other file's name. 
With configuration you can use files like `lambda-user.yml`, `lambda-order.yml`, `bucket-media.yml`.

```yml
# serverless.yml

#..

inputs:
  src: .
  autoDiscovery: 'components/**/*.yml'
```

Even also with JSON format:

```yml
# serverless.yml

#..

inputs:
  src: .
  autoDiscovery: 
    - 'components/**/*.yml'
    - 'components/**/*.yaml'
    - 'components/**/*.json'
```

Playing with uploaded source code:

```yml
# serverless.yml

#..

inputs:
  src: '/components'  # will upload only "./components" directory
  autoDiscovery: 
    - './**/*.yml'    # this will match all files in uploaded "./components" directory
```

You can also use a trick and create a recursive structure:

```yml
# serverless.yml

#..

inputs:
  globals:               # global inputs are merged in all children, and recursively into their children
    prop: value
  components:
    my-lambda:
      component: aws-lambda
      inputs:
        src: ./my-service/
        handler: index.handler

    sub-components:
      component: meta 
      globals:           # global inputs can be overrides across the relation graph
        prop: value
      inputs:
        components:

          my-lambda2:
            component: aws-lambda
            inputs:
              name: my-lambda
              src: ./my-other-service/
              handler: index.handler

          my-lambda3:
            component: aws-lambda
            inputs:
              name: my-other-lambda
              src: ./my-other-service2/
              handler: index.handler
```

You can also deploy multiple components with the same configurations but different names:

```yml
# serverless.yml

#..

inputs:
  globals:
    component: aws-lambda
    src: ./services/
    handler: index.handler
  components:
    - my-lambda
    - my-other-lambda
    - my-an-other-one-lambda
```

By default `region`,`org`,`app`,`stage` are inherited from the main components but can also be override using globals:

```yml
# serverless.yml

component: meta
name: myCollection
org: daaru
app: myApp
stage: dev

inputs:
  globals:
    app: myOtherApp   # components will be deployed into different app
    stage: staging    # and also into different stage
    org: myOrg        # or even a different organization
  components:
    my-lambda:
      component: aws-lambda
      inputs:
        src: ./my-service/
        handler: index.handler
```

NOTE: At the moment the `src` property is not transformed or re-based. 
All paths are relative from directory where deploy is triggered.

### 4. Deploy

Once you have the directory set up, you're now ready to deploy. Just run the following command from within the directory containing the `serverless.yml` file:

```
$ serverless deploy
```

Your first deployment might take a little while, but subsequent deployment would just take few seconds. For more information on what's going on during deployment, you could specify the `--debug` flag, which would view deployment logs in realtime:

```
$ serverless deploy --debug
```

### 5. Info

Anytime you need to know more about your created components sub sub-components, you can run the following command to view the most info. 

```
$ serverless info
```

### 6. Remove

If you wanna tear down your created components and sub-components that was created during deployment, just run the following command in the directory containing the `serverless.yml` file. 
```
$ serverless remove
```
