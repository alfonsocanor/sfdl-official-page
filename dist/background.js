let totalLogsCompletelyRetrieved,totalLogs2Process=0,lastBatchExecuted=!1,allLogsDownloaded=[];const BYTES_SIZE_LIMIT=22e6;let fetchAbortController=new AbortController;const processResponseBasedOnContentType={httpError:e=>({hasError:!0,error:e.message}),contentTypeJson:async e=>(await e.json()).records.map((e=>e)),contentTypeText:async(e,t,o)=>({id:t,name:o,response:e.text()})};function calculateArraySize(e){return new Blob([JSON.stringify(e)]).size}function allApexLogListProcessed(e,t){let o=t.map((e=>e.id));return e.filter((e=>!o.includes(e.id)))}function validateResetTotalLogsProcessed(){return totalLogs2Process===totalLogsCompletelyRetrieved}function applyResetProperties(){totalLogsCompletelyRetrieved=0,totalLogs2Process=0}function abortFetchOperation(){fetchAbortController.abort(),fetchAbortController=new AbortController}async function getInformationFromSalesforce(e,t,o,s,a){return{response:await fetchLogsRecords(e,o,s,a,t.fileName),additionalOutputs:t}}async function fetchLogsRecords(e,t,o,s,a){let r={};try{r=await fetch(e,{method:"GET",headers:{Authorization:"Bearer "+t.authToken,"Content-type":"application/json; charset=UTF-8; text/plain"},signal:fetchAbortController.signal}),200!==r.status&&(o="httpError",r.message=401===r.status?r.statusText+": Invalid session":r.message)}catch(e){o="httpError",r.message=e.message}return processResponseBasedOnContentType[o](r,s,a)}function logName2Display(e){return e.LogUser.Name+" | "+createOperationFormat(e.Operation)+" | "+e.LogLength+"bytes | "+createDatetimeFormat(new Date(e.LastModifiedDate))}function createOperationFormat(e){let t=new RegExp("/","g");return e.includes("__")?e.replace(t,"").split("__")[1]:e.replace(t,"")}function createDatetimeFormat(e){return padNumberValues(e.getDay(),2,"0")+"/"+padNumberValues(e.getMonth(),2,"0")+" "+padNumberValues(e.getHours(),2,"0")+"h"+padNumberValues(e.getMinutes(),2,"0")+"m"+padNumberValues(e.getSeconds(),2,"0")+"s"}function padNumberValues(e,t,o){return e.toString().padStart(t,o)}function setKeyValueLocalStorage(e,t){chrome.storage.local.set({[e]:t})}chrome.tabs.onRemoved.addListener((()=>{abortFetchOperation(),applyResetProperties(),setKeyValueLocalStorage("isDownloadInProgress",!1)})),chrome.runtime.onMessage.addListener(((e,t,o)=>{if("downloadApexLogs"===e.message){let t=[];return totalLogsCompletelyRetrieved=0,totalLogs2Process=e.apexLogList.length,e.apexLogList.every((async s=>{let a,r=e.sessionInformation.instanceUrl+s.attributes.url+"/Body",n=logName2Display(s);try{a=await getInformationFromSalesforce(r,{fileName:n},e.sessionInformation,"contentTypeText",s.Id)}catch(e){console.log("Download operation cancelled!")}let l=await a.response.response;return a.response.response=l,t.push(a.response),allLogsDownloaded.push(a.response),totalLogsCompletelyRetrieved++,totalLogs2Process===totalLogsCompletelyRetrieved&&(applyResetProperties(),setKeyValueLocalStorage("isDownloadInProgress",!1),o({logsDownloaded:!0})),!0})),!0}if("downloadProgressBar"===e.message)return o({totalLogsCompletelyRetrieved}),!1;if("getLogsDownloaded"===e.message){let e=[];for(const t in allLogsDownloaded)if(e.push(allLogsDownloaded[t]),calculateArraySize(e)>22e6)break;allLogsDownloaded=allApexLogListProcessed(allLogsDownloaded,e);let t=allLogsDownloaded.length>0;return o({batchLogs2Process:e,continueProcess:t}),!1}return!1}));