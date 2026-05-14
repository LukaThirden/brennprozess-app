sub Main()
    port = CreateObject("roMessagePort")
    video = CreateObject("roVideoScreen")
    video.SetPort(port)

    ' Enable continuous looping.
    video.SetLoop(true)

    ' Change this path to the MP4 file on your SD card.
    videoFile = "sd:/video.mp4"

    content = CreateObject("roAssociativeArray")
    content.Push("uri", videoFile)
    content.Push("type", "video")

    video.SetContentList([content])
    video.Show()

    while true
        msg = wait(0, port)
        if type(msg) = "roVideoEvent" then
            if msg.IsScreenClosed() then
                exit while
            else if msg.isRequestFailed() then
                print "Playback failed: " + msg.GetFailureReason()
            end if
        end if
    end while
end sub
