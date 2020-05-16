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
  autoDiscovery: './**/serverless.yml'  # (optional) find serverless components declaration files using file glob
  components:                           # (required) components list.
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
    my-lambda:
      component: aws-lambda
      inputs:
        src: ./my-service/
        handler: index.handler

    my-other-lambda:
      component: aws-lambda
      inputs:
        src: ./my-other-service/
        handler: index.handler
```

Components files can be discovered using multiple glob patterns:

```yml
# serverless.yml

#..

inputs:
  autoDiscovery: 
    - 'components/**/serverless.yml'     # include all files in a directory
    - '!components/x/**/serverless.yml'  # then, exclude a sub directory
    - 'components/x/serverless.yml'      # then, re-include a single file
```

Note that you can also use an other file's name:

```yml
# serverless.yml

#..

inputs:
  autoDiscovery: 'components/**/*.yml'
```

Even also with JSON format:

```yml
# serverless.yml

#..

inputs:
  autoDiscovery: 
    - 'components/**/*.yml'
    - 'components/**/*.yaml'
    - 'components/**/*.json'
```

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

Anytime you need to know more about your created `aws-ssm-document` instance, you can run the following command to view the most info. 

```
$ serverless info
```

### 6. Remove

If you wanna tear down your entire `aws-ssm-document` infrastructure that was created during deployment, just run the following command in the directory containing the `serverless.yml` file. 
```
$ serverless remove
```
