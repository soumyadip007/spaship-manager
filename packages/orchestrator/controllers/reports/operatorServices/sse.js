const event = require('../../../models/event')
const eventTimeTrace = require('../../../models/eventTimeTrace')
const website = require('../../../models/website')
const EventSource = require("eventsource");
const { uuid } = require('uuidv4');
const config = require('../../../config');

var source = new EventSource(config.get("sse"));

source.onmessage = function (eventRequest) {
    const response = JSON.parse(eventRequest.data);
    console.log(response);
    const spaList = response?.payload?.message?.Website?.config?.WebsiteConfig?.components;
    
    const envsList = response?.payload?.message?.Website?.enabledEnvs;
    const currentTime = new Date();

    for (let env of envsList) {
        for (let item of spaList) {
            if (item?.kind == 'git') {
                const eventBody = new event({
                    id: uuid(),
                    eventId: response?.id,
                    propertyName: response?.payload.cr_name,
                    spaName: getSPAName(item),
                    version: 1,
                    envs: env,
                    branch: "main",
                    code: response?.payload?.CODE,
                    failure: false,
                    isActive: true,
                    createdAt: response?.time || currentTime,
                    updatedAt: response?.time || currentTime,
                    traceId: response?.payload.traceId
                });
                 createEventRequest(eventBody);
  //             console.log(eventBody);
            }
        }
    }

    createEventTimeTraceRequest(response);
};


function getSPAName(item) {
    const contextName = item?.context.replace(/[\/\\]/g, '');
    if (contextName.length > 0)
        return contextName;
    return item.spec.dir.slice(item.spec.dir.lastIndexOf("/") + 1, item.spec.dir.length);
}

async function createEventRequest(response) {
    const saveResponse = await response.save();
}

async function createEventTimeTraceRequest(response) {
    const envsList = response?.payload?.message?.Website?.enabledEnvs;
    for (let env of envsList) {
       // console.log(env)
        const currentTime = new Date();
        const checkTraceId = await eventTimeTrace.findOne({ traceId: response.payload.traceId, envs: env });
       // console.log(checkTraceId);
        if (checkTraceId == null) {
            const eventTimeTraceData = new eventTimeTrace({
                id: uuid(),
                traceId: response?.payload?.traceId,
                propertyName: response?.payload.cr_name,
                //spaName: response?.payload?.cr_name,
                envs: env,
                initialCode: response?.payload?.CODE,
                finalCode: null,
                failure: true,
                createdAt: response?.time || currentTime,
                completedAt: null,
                consumedTime: 0
            });
          const saveResponse = await eventTimeTraceData.save();
        }
        else {
            let diff = (checkTraceId.createdAt.getTime() - new Date(response.time).getTime()) / 1000;
            diff /= 60;
            const consumedTime = Math.abs(Math.round(diff));
            const updated = await eventTimeTrace.findOneAndUpdate({
                traceId: response.payload.traceId, envs: env 
            }, { $set: { finalCode: response?.payload?.CODE, completedAt: response?.time, consumedTime: consumedTime, failure: false } },
                function (err, data) {
                    if (err) {
                        console.log("error");
                    }
                });
        }
    }
}