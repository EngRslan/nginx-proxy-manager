
const ldap		 = require('ldapjs');
const settingsModel = require('../models/setting')

const LDAP_Manager = {
    loginLDap:(username,password)=>{

		return new Promise((resolve,reject)=>{
			var ldapCLient = ldap.createClient({
				url : 'ldap://192.168.10.10:389',
                bindDN : 'ibind@proeyes.org',
                bindCredentials : 'Me@123456',
                connectTimeout :10000
			});
            let attr = username.includes("@")?'userPrincipalName':'samaccountname';
            ldapCLient.on('connectTimeout',(e)=>{
                console.log('connectTimeout',e)
                reject('Connection Timeout');
            })
            ldapCLient.on('connectRefused',(e)=>{
                console.log('connectRefused',e)
                reject('Connection Refused');
            })
            ldapCLient.on('connectRefused',(e)=>{
                console.log('connectRefused',e)
                reject('Connection Error');
            })
            ldapCLient.on('socketTimeout',(e)=>{
                console.log('socketTimeout',e)
                reject('Socket Timeout');
            })
            ldapCLient.on('error',(e)=>{
                console.log('error',e)
                reject('error');
            })
            // ldapCLient.on('resultError',(e)=>{
            //     console.log('resultError',e)
            //     reject('resultError');
            // })
            this.LDAPSearch()
            ldapCLient.on('timeout',(e)=>{
                console.log('timeout',e)
                reject('timeout');
            })
            ldapCLient.on('end',(e)=>{
                console.log('end',e)
                reject('end');
            })

            console.log('search Started')
            ldapCLient.search('CN=Users,DC=proeyes,DC=org',{ 
                filter:'(&(objectClass=user)('+attr+'='+username+'))',
                scope:'sub',
                sizeLimit:1

             },(err,res)=>{
                console.log('search back')
                 if(err){
                    reject('Error Occured');
                 }else{
                    res.on('searchEntry',(entry)=>{
                        console.log('entry: ' + JSON.stringify(entry.object));
                        ldapCLient.bind(entry.dn,password,function(err,res){
                            if(err){
                                errorMessage = "Unknown error please try again later";
            
                                if(err instanceof ldap.InvalidCredentialsError){
                                    errorMessage = "Invalid Username/Password";
                                }
                                reject(errorMessage);
                            }
                            else{
                                resolve();
                            }
            
                            ldapCLient.unbind();
                        })
                    });
                    res.on('searchRequest', (searchRequest) => {
                        console.log('searchRequest: ', searchRequest.messageID);
                      });
                    res.on('searchReference', function (referral) {
                        console.log('Referral', referral);
                    });
                    res.on('error',(err)=>{
                        console.log('error',err)
                        reject('Error Occured');
                    });
                    res.on('end', (result) => {
                        //if(result.sent)
                        console.log('matchedDN',result.matchedDN);
                        // reject('status: ' + result.errorMessage);

                      });
                 }
                    
             })
			
		})
	},
	LDAPAuthenticateUser:(username,password)=>{
		return new Promise((resolve,reject)=>{

            settingsModel
                .query()
                .where({id:'ldap-auth'})
                .first()
                .then((setting)=>{
                    var ldapCLient = ldap.createClient({
                        url : `ldap://${setting.meta.host}:${setting.meta.port}`,
                        bindDN : setting.meta.bind_username,
                        bindCredentials : setting.meta.bind_secret,
                        connectTimeout :10000 
                    });
        
                    LDAP_Manager.LDAPAuthenticate(ldapCLient,setting.meta.base_dn,username,password,setting.meta.scope,setting.meta.user_naming_attr).then(res=>{
                        resolve({
                            username : res[setting.meta.user_naming_attr],
                        })
                    }).catch(err=>{
                        reject(err)
                    })
                })
		})
	},
    LDAPAuthenticate:(client,base, identity, password,scope,user_naming_attr)=>{
        return new Promise((resolve,reject)=>{
            LDAP_Manager.LDAPSearch(client,base,{scope: scope||'sub', filter: `(${user_naming_attr || 'CN'}=${identity})`}).then(result=>{
                if(result.entries.length != 1){
                    reject('Invalid Username/Password')
                }
                client.bind(result.entries[0].dn, password,(err)=>{
                    if(err){
                        reject(err.name)
                    }else{
                        resolve(result.entries[0].object);
                    }
                })
                
            }).catch(err=>{
                reject(err.name);
            })
            
        })
    },
    LDAPSearch:(client,base, options)=>{
        return new Promise((resolve, reject) => { 
            var searchCallback = function (err, result) {
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
            client.search(base,options,searchCallback);
        });
    }
};

module.exports = LDAP_Manager;