package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/aws/aws-sdk-go-v2/service/sesv2/types"
	"github.com/aws/smithy-go/logging"
)



func main(){
	fmt.Println("Hello world")

	customResolver := aws.EndpointResolverFunc(func(service, region string) (aws.Endpoint, error) {
        if service == sesv2.ServiceID {
            return aws.Endpoint{
                URL:           "http://localhost:8005", 
                SigningRegion: "us-east-1",
            }, nil
        }
        return aws.Endpoint{}, fmt.Errorf("unknown endpoint requested")
    })

    // ローカル用の設定読み込み
    cfg, err := config.LoadDefaultConfig(context.TODO(), 
        config.WithEndpointResolver(customResolver),
        config.WithHTTPClient(&http.Client{}),
        config.WithLogger(logging.NewStandardLogger(os.Stderr)),
    )
    if err != nil {
        log.Fatalf("unable to load SDK config, %v", err)
    }

    // SESクライアントの作成
    svc := sesv2.NewFromConfig(cfg)

    // メール送信リクエストの作成
    input := &sesv2.SendEmailInput{
        Destination: &types.Destination{
            ToAddresses: []string{
                "recipient@example.com",
            },
        },
        Content: &types.EmailContent{
            Simple: &types.Message{
                Subject: &types.Content{
                    Data: aws.String("Test件名"),
                },
                Body: &types.Body{
                    Text: &types.Content{
                        Data: aws.String("test本文"),
                    },
                },
            },
        },
        FromEmailAddress: aws.String("sender@example.com"),
    }

    // メール送信
    result, err := svc.SendEmail(context.TODO(), input)
    if err != nil {
        log.Fatalf("Failed to send email: %v", err)
    }

    fmt.Printf("Email sent with message ID: %s\n", *result.MessageId)

}


