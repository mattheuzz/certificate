import { APIGatewayProxyHandler } from "aws-lambda";
import { document } from "../utils/dbClient";


export const handler: APIGatewayProxyHandler = async (event) => {
  const { id } = event.pathParameters

  const response= await document
  .query({
    TableName: "zusers_certificate",
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": id,
    },
  })
  .promise();

  const userCertificate = response.Items[0]

  if(userCertificate) {
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Certificado valido",
        name: userCertificate.name
      })
    }
  }
}
