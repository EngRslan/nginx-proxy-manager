
const ldap		        = require('ldapjs');
const settingsModel     = require('../models/setting');
const logger            = require('./../logger').global;
const { EOL }           = require('os');
const error             = require('../lib/error');

const Internals = {
    CleanClient : (client)=>{
        return new Promise((resolve,reject)=>{
            if(client){
                client.removeAllListeners();
            }

            resolve();
        })
    }
}
const LDAP_Manager = {
    
	LDAPAuthenticateUser: async (username,password)=>{
        var ldapCLient;

        try {
            var setting = await settingsModel.query().where({id:'ldap-auth'}).first();
            if(!setting || setting.value !== 'enable')
                throw new Error("LDAP Not Configured Or Not Enabled");

            var clientOpts = {
                url : `ldap${setting.meta.transport === 'ssl'?'s':''}://${setting.meta.host}:${setting.meta.port}`,
                bindDN : setting.meta.bind_username,
                bindCredentials : setting.meta.bind_secret,
                connectTimeout :10000 ,
                
            };
            
            if(setting.meta.transport === 'ssl'){
                clientOpts.tlsOptions = {
                    ca:setting.meta.ca,
                    rejectUnauthorized: !(setting.meta.skip_cert_verify || false)
                }
            }
            
            ldapCLient = ldap.createClient(clientOpts);
                ldapCLient.once('error',(err)=>{console.log(err);throw new Error('dd')})
                ldapCLient.once('connectRefused',(err)=>{console.log(err);throw new Error('dd')})
                ldapCLient.once('connectTimeout',(err)=>{console.log(err);throw new Error('dd')})
                ldapCLient.once('connectError',(err)=>{console.log(err);throw new Error('dd')})
                ldapCLient.once('setupError',(err)=>{console.log(err);throw new Error('dd')})
                ldapCLient.once('socketTimeout',(err)=>{console.log(err);throw new Error('dd')})
                ldapCLient.once('timeout',(err)=>{console.log(err);throw new Error('dd')})
            if(setting.meta.transport === 'start-tls'){
                await new Promise((resolve,reject)=>{

                ldapCLient.once('error',reject)
                ldapCLient.once('connectRefused',reject)
                ldapCLient.once('connectTimeout',reject)
                ldapCLient.once('connectError',reject)
                ldapCLient.once('setupError',reject)
                ldapCLient.once('socketTimeout',reject)
                ldapCLient.once('timeout',reject)

                    ldapCLient.starttls({
                        ca:setting.meta.ca,
                        rejectUnauthorized: !(setting.meta.skip_cert_verify || false)
                    },[],(err)=>{

                        if(err){
                            reject(err)
                        }else{
                            resolve()
                        }
                    });
                })
            }
            

            var containers = [];
                    
            if(setting.meta.search_containers){
                    containers = setting.meta.search_containers.split(EOL);
            }

            if(!containers || containers.length <= 0){
                containers = [setting.meta.base_dn]
            }

            for(var container of containers){ 
                logger.debug("LDAP Authenticate Using Contanienr "+ container)
                try{
                    var res = await LDAP_Manager.LDAPAuthenticate(ldapCLient,container,username,password,setting.meta.scope,setting.meta.user_naming_attr);
                    await Internals.CleanClient(ldapCLient)
                    return { username : res[setting.meta.user_naming_attr] };
                }catch(authErr){
                   console.log('iam')
                    if(authErr instanceof ldap.NoSuchObjectError && containers.indexOf(container) !== containers.length - 1)
                    {
                        continue;
                    }
                    throw authErr;
                }
            }

        }catch(err){
            logger.debug("LDAP Error : "+ err.toString())
            await Internals.CleanClient(ldapCLient)
            throw new error.ConfigurationError(err.toString());
        }
	},
    LDAPAuthenticate:(client,base, identity, password,scope,user_naming_attr)=>{
        return new Promise((resolve,reject)=>{
            console.log('here123')
        
            client.once('error',reject)
            client.once('connectRefused',reject)
            client.once('connectTimeout',reject)
            client.once('connectError',reject)
            client.once('setupError',reject)
            client.once('socketTimeout',reject)
            client.once('timeout',reject)
            
            LDAP_Manager.LDAPSearch(client,base,{scope: scope||'sub', filter: `(${user_naming_attr || 'CN'}=${identity})`}).then(result=>{
                if(result.entries.length != 1){
                    reject(new ldap.NoSuchObjectError("Invalid Username/Password"))
                }
                console.log('here')
                client.bind(result.entries[0].dn, password,(err)=>{
                console.log('here2')

                    if(err){

                        reject(err)
                    }else{
                        resolve(result.entries[0].object);
                    }
                })
                
            }).catch(err=>{
                reject(err);
            })
            
        })
    },
    
    LDAPSearch:(client,base, options)=>{
        return new Promise((resolve, reject) => { 

            var searchCallback = function (err, result) {
            console.log('heresearch2')

                var r = {
                    entries: [],
                    references: []
                };

                result.on('searchEntry', function (entry) {
                    r.entries.push(entry);
                });

                result.on('searchReference', function (reference) {
                    r.references.push(reference);
                });

                result.on('error', function (err) {
                    reject(err);
                });

                result.on('end', function (result) {
                    if (result.status === 0) {
                    resolve(r);
                    } else {
                    reject(new Error('non-zero status code: ' + result.status));
                    }
                });
            };
            console.log('heresearch')

            client.search(base,options,searchCallback);
        });
    }
};

module.exports = LDAP_Manager;