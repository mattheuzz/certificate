import { APIGatewayProxyHandler } from "aws-lambda";
import {
  ICreateCertificateRequest,
  ITemplate,
} from "../shared/interface/certificate/generateCertificate";
import { document } from "../utils/dbClient";
import dayjs from "dayjs";
import handlebars from "handlebars";
import { join } from "path";
import { readFileSync } from "fs";
import chromium from "chrome-aws-lambda";
import { S3 } from "aws-sdk";

const compile = async (data: ITemplate) => {
  const filePath = join(process.cwd(), "src", "template", "certificate.hbs");

  const html = readFileSync(filePath, "utf-8");

  return handlebars.compile(html)(data);
};

export const handler: APIGatewayProxyHandler = async (event) => {
  const { id, name, grade } = JSON.parse(
    event.body
  ) as ICreateCertificateRequest;

  const response = await document
    .query({
      TableName: "zusers_certificate",
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": id,
      },
    })
    .promise();

  const userAlredyExist = response.Items[0];
  if (!userAlredyExist) {
    await document
      .put({
        TableName: "users_certificate",
        Item: {
          id,
          name,
          grade,
          Created_at: new Date(),
        },
      })
      .promise();
  }

  const medalPath = join(process.cwd(), "src", "templates", "selo.png");

  const medal = readFileSync(medalPath, "base64");

  const data: ITemplate = {
    id,
    name,
    grade,
    date: dayjs().format("dd/mm/yyyy"),
    medal,
  };

  const content = await compile(data);

  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = browser.newPage();

  await (await page).setContent(content);

  const pdf = (await page).pdf({
    format: "a4",
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    path: process.env.IS_OFFLINE ? "./certificate.pdf" : null,
  });

  await browser.close();

  const s3 = new S3();

  await s3
    .putObject({
      Bucket: "certificado2022",
      Key: `${id}.pdf`,
      ACL: "public-read",
      Body: pdf,
      ContentType: "aplication/pdf",
    })
    .promise();

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: 'certificado criado com sucesso',
      url: `https://certificado.com.br/${id}.pdf`
    }),
  };
};
