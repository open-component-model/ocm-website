---
title: ocm-pubsub
name: ocm-pubsub
url: /docs/cli-reference/help/ocm-pubsub/
draft: false
images: []
weight: 55
toc: true
sidebar:
  collapsed: true
---
### Description


An OCM repository can be configured to propagate change events via a 
publish/subscribe system, if there is a persistence provider for the dedicated
repository type. If available any known publish/subscribe system can
be configured with [ocm set pubsub](/docs/cli-reference/set/pubsub/) and shown with
[ocm get pubsub](/docs/cli-reference/get/pubsub/). Hereby, the pub/sub system 
is described by a typed specification.


The following list describes the supported publish/subscribe system types, their
specification versions, and formats:

- PubSub type <code>compound</code>

  A pub/sub system forwarding events to described sub-level systems.

  The following versions are supported:
  - Version <code>v1</code>
  
    It is described by the following field:
    
    - **<code>specifications</code>**  *list of pubsub specs*
    
      A list of nested sub-level specifications the events should be 
      forwarded to.
  

- PubSub type <code>redis</code>

  a redis pubsub system.

  The following versions are supported:
  - Version <code>v1</code>
  
    It is describe by the following field:
    
    - **<code>serverAddr</code>**  *Address of redis server*
    - **<code>channel</code>**  *pubsub channel*
    - **<code>database</code>**  *database number*
    
      Publishing using the redis pubsub API. For every change a string message
      with the format <component>:<version> is published. If multiple repositories
      should be used, each repository should be configured with a different
      channel.
  
There are persistence providers for the following repository types:
  - <code>OCIRegistry</code>


### See Also


