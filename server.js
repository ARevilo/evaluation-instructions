import express from "express";
import fs from "node:fs";
import { XMLParser } from "fast-xml-parser";
import * as OpenApiValidator from 'express-openapi-validator';
import { load } from "js-yaml"

// import openapixml from './xml-api/openapi-xml.yaml'
// import openapicompanies from './openapi-companies.yaml' 

const DEFAULT_SERVER_PORT = 3000;
const PORT = process.env.PORT || DEFAULT_SERVER_PORT;

const DEFAULT_BASE_URL = `http://localhost:${PORT}`;
const BASE_URL = process.env.BASEURL || DEFAULT_BASE_URL;

const REMOTE_URL = 'https://raw.githubusercontent.com/MiddlewareNewZealand/evaluation-instructions/main';

const app = express();

// Configure validators to verify requests and responses against openapi spec
// Note that response validation supports json only (not XML)
try {
    const defaultValidatorOpts = {
        validateRequests: true,
        validateResponses: true,
        validateApiSpec: true
    }
    app.use(OpenApiValidator.middleware({ ...defaultValidatorOpts, apiSpec: load(fs.readFileSync('./xml-api/openapi-xml.yaml', 'utf8')) }))
    app.use(OpenApiValidator.middleware({ ...defaultValidatorOpts, apiSpec: load(fs.readFileSync('./openapi-companies.yaml', 'utf8')) }))
    app.use(OpenApiValidator.middleware({ ...defaultValidatorOpts, apiSpec: load(fs.readFileSync('./openapi-companies-test.yaml', 'utf8')) }))

    console.log('Local OpenAPI specification files loaded')
} catch (error) {
    // Allows simple production deployment without external assets
    // Workaround for difficulty bundling YAML files with esbuild
    console.log('Local OpenAPI specification files unavailable. Continuing without validation')
}

// Fallback error handler in case the real error was inside us all along
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        message: err.message,
        errors: err.errors,
    });
});

// Configure the route/endpoint
app.get('/companies/:id', async (req, res) => {

    var companyId = req.params.id;
    // Could do more input validation here for more detailed errors etc

    // Fetch XML data from the remote
    const xmlResponse = await fetch(`${REMOTE_URL}/xml-api/${companyId}.xml`)

    // Process based on the respose
    // Assumption: responses consistent with the API spec do not need further content validation
    switch (xmlResponse.status) {
        case 200: // OK
            // Get the data from the resonse
            const xmlContent = await xmlResponse.text()
            const parser = new XMLParser()
            // jsobject that can be serialised into json
            const parsedResponse = parser.parse(xmlContent).Data
            // Return the parsed response as json
            res.status(200).json(parsedResponse);
            break;
        case 404: // Not Found
            res.status(404).send({
                error: '404',
                error_description: `Company not found with id ${companyId}`,
            })
            break
        default:
            // Our API spec does not allow for other error codes however the description can be updated
            res.status(404).send({
                error: '404',
                error_description: `Company not found with id: ${companyId} remote status: ${xmlResponse.status}`
            })
            break;
    }
})

// Testing with local XML data only
app.get('/test/companies/:id', (req, res) => {
    var companyId = req.params.id;
    try {
        const testXML = fs.readFileSync(`./xml-api/${companyId}.xml`, 'utf8');
        const parser = new XMLParser()
        const parsedResponse = parser.parse(testXML).Data // jsobject 
        console.log(parsedResponse)
        res.status(200).json(parsedResponse);
    } catch (error) {
        res.status(404).send({
            error: '404',
            error_description: `Company not found with id: ${companyId}`,
        })
    }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));