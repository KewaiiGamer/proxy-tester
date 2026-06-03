package main

import (
	"context"
	"embed"
	"fmt"
	"proxy-tester/app"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/build
var assets embed.FS

func main() {
	proxyApp := app.New()

	err := wails.Run(&options.App{
		Title:     "Proxy Tester",
		Width:     1200,
		Height:    800,
		MinWidth:  900,
		MinHeight: 600,
		Frameless: false,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 15, G: 23, B: 42, A: 1},
		Bind: []any{
			proxyApp,
		},
		OnStartup: func(ctx context.Context) {
			proxyApp.OnStartup(ctx)
		},
		OnShutdown: func(ctx context.Context) {
			// cleanup
		},
	})

	if err != nil {
		fmt.Println("Fatal:", err.Error())
	}
}
