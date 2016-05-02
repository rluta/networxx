To run the presentation locally:

 * Install brew dependencies

 
     brew install node docker docker-machine
     npm install -g bower
 
 * Clone TTY.js 


    git clone https://github.com/rluta/tty.js

 
 * Start a docker-machine and configure the environment
 
 
    docker-machine start default
    eval $(docker-machine env default)
 
   
 * Pull the h2demo docker image: docker pull rluta/h2demo:devoxx
 
 
    docker pull rluta/h2demo:devoxx

   
 * Clone this repository and install the npm dependencies


    git clone https://github.com/rluta/networxx.git  
    (cd networxx-reveal && npm install && bower install)
  
  
 * Start the tty server
 
 
    (cd tty.js && bin/tty.js &)
 
   
 * Start the docker demo
 
 
    docker run -it --rm -p 80:80 -p 8080:8080 -p 443:443 -p 8443:8443 -p 8444:8444 rluta/h2demo:devoxx demo.sh
 
   
 * Start the reveal.js presentation
 
 
    cd networxx-reveal && grunt serve
   
   
