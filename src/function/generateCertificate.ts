import { APIGatewayProxyHandler } from "aws-lambda"
import { ICreateCertificateRequest } from "../shared/interface/certificate/generateCertificate"
import { document } from "../utils/dbClient"

export const handler: APIGatewayProxyHandler = async (event) => {
  const { id, name, grade } = JSON.parse(event.body) as ICreateCertificateRequest

  await document.put({
    TableName: 'users_certificate',
    Item: {
      id,
      name,
      grade,
      Created_at: new Date()
    }
  }).promise()
  
  const response = await document.query({
    TableName: 'zusers_certificate',
    KeyConditionExpression: 'id = :id', 
    ExpressionAttributeValues: {
      ':id': id
    }
  }).promise()

  return {
    statusCode: 201,
    body: JSON.stringify(response.Items[0])
  }
} 
