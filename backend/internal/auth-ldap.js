
const ldap		 = require('ldapjs');

module.exports = {
	loginLDap(username,password){
        //username="m.raslan";
        //password="Walaa01016890084"
		return new Promise((resolve,reject)=>{
			var ldapCLient = ldap.createClient({
				url : 'ldap://192.168.10.10:389',
                bindDN : 'ibind@proeyes.org',
                bindCredentials : 'Me@123456',
			});
            let attr = username.includes("@")?'userPrincipalName':'samaccountname';
            
            ldapCLient.search('CN=Users,DC=proeyes,DC=org',{ 
                filter:'(&(objectClass=user)('+attr+'='+username+'))',
                scope:'sub',
                sizeLimit:1

             },(err,res)=>{
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
                    res.on('error',(err)=>{
                        reject('Error Occured');
                    })
                 }
                    
             })
			
		})
	}
};
