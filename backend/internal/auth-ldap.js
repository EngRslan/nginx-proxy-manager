
const ldap		 = require('ldapjs');

module.exports = {



	loginLDap(username,password){
		return new Promise((resolve,reject)=>{
			var ldapCLient = ldap.createClient({
				url : 'ldap://192.168.10.10:389',
                bindDN : 'ibind@proeyes.org',
                bindCredentials : 'Me@123456',
			});
            ldapCLient.search('CN=Users,DC=proeyes,DC=org',{ 
                filter:'(&(objectClass=user)(samaccountname=m.raslan))',
                scope:'sub',
                sizeLimit:1

             },(err,res)=>{
                 if(err){
                    reject('Error Occured');
                 }else{
                    res.on('searchEntry',(entry)=>{
                        console.log('entry: ' + entry.dn);
                        ldapCLient.bind(entry.dn,'Walaa01016890084',function(err,res){
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
                    res.on('error',(err)=>{
                        reject('Error Occured');
                    })
                 }
                    
             })
			
		})
	}

	
};
