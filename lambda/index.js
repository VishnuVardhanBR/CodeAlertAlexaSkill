const Alexa = require('ask-sdk-core');
const axios = require('axios');

const GetContestsIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetContestsIntent';
  },
  async handle(handlerInput) {
    try {
      const response = await axios.get('https://kontests.net/api/v1/all');
      const contests = response.data;

      
      const filteredContests = contests.filter(
        (c) =>
          (["LeetCode", "CodeForces"].includes(c.site) ||
            (c.site === "CodeChef" && c.url.includes("START"))) &&
          isWithinNextWeek(new Date(c.start_time))
      );

      
      const uniqueContests = [];
      const addedDates = new Set();

      filteredContests.forEach((contest) => {
        const startDate = new Date(contest.start_time).toLocaleDateString('en-US');
        const key = `${contest.site}-${startDate}`;

        if (!addedDates.has(key)) {
          uniqueContests.push(contest);
          addedDates.add(key);
        }
      });

      
      const contestDetails = uniqueContests.map((contest) => {
        const startDate = new Date(contest.start_time);
        const options = { weekday: 'long' };
        const weekday = startDate.toLocaleDateString('en-US', options);
        return `${contest.site} on ${weekday}`;
      }).join(', ');

      const speechText = `The upcoming contests are ${contestDetails}.`;

      return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse();
    } catch (error) {
      console.error(error);
      const speechText = 'Sorry, there was an error while retrieving contest data. Please try again later.';
      return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse();
    }
  },
};

// Helper function to check if a date is within the next week
function isWithinNextWeek(date) {
  const today = new Date();
  const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  return date >= today && date < nextWeek;
}

// Add other handlers, such as LaunchRequestHandler and HelpIntentHandler, if needed.

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    GetContestsIntentHandler
    // Add other intent handlers here
  )
  .lambda();
